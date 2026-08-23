import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from config_loader import load_config
from encoder import preprocess_questionnaire_data
from allocator import cluster_juniors, assign_seniors_flexible

load_dotenv()
MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/mydb?directConnection=true")
DB_NAME = "mydb"

def run_allocation_pipeline():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    config = load_config()
    limits = config["group_limits"]
    
    # 1. Fetch System Configuration
    sys_config = db.SystemConfig.find_one()
    if not sys_config:
        print("Error: SystemConfig not found in database. Please initialize it via Admin portal.")
        return
        
    academic_year = sys_config.get("currentAcademicYear", "2026-2027")
    y1_prefix = sys_config.get("firstYearBatchPrefix")   
    y2_prefix = sys_config.get("secondYearBatchPrefix")  

    if not all([y1_prefix, y2_prefix]):
        print("Error: Batch prefixes are missing in SystemConfig.")
        return

    print(f"Loaded config for {academic_year}. Phase 1 - Y1: {y1_prefix}, Y2: {y2_prefix}")

    # 2. Securely Fetch Users strictly by their Batch Prefix
    y1_users = list(db.User.find({"rollNumber": {"$regex": f"^{y1_prefix}"}}))
    y2_users = list(db.User.find({"rollNumber": {"$regex": f"^{y2_prefix}"}}))

    df_comentors = pd.DataFrame(y2_users)

    y1_ids = [u['_id'] for u in y1_users]
    y2_ids = [u['_id'] for u in y2_users]

    # 3. Fetch Questionnaire Responses
    df_juniors = pd.DataFrame(list(db.QuestionnaireResponse.find({
        "userId": {"$in": y1_ids}, 
        "academicYear": academic_year
    })))
    
    comentor_res = pd.DataFrame(list(db.QuestionnaireResponse.find({
        "userId": {"$in": y2_ids},
        "academicYear": academic_year
    })))

    if df_juniors.empty:
        print("No 1st-year mentee data found. Exiting.")
        return

    print(f"Strict filtering applied: {len(df_juniors)} Mentees (1st Yr), {len(df_comentors)} Co-Mentors (2nd Yr).")

    # 4. Encoding
    print("Encoding features...")
    X_juniors = preprocess_questionnaire_data(df_juniors, config["weights_juniors"])
    X_comentors = preprocess_questionnaire_data(comentor_res, config["weights_seniors"]) if not comentor_res.empty else pd.DataFrame(index=df_comentors.index)

    # 5. Cluster Mentees dynamically
    print("Clustering 1st-year mentees...")
    df_juniors, centroids = cluster_juniors(
        X_juniors, df_juniors, 
        limits["mentees_min"], limits["mentees_max"]
    )

    # 6. Assign 2nd-Year Co-Mentors
    print("Assigning 2nd-year Co-Mentors...")
    df_comentors = assign_seniors_flexible(
        X_comentors, df_comentors, centroids, 
        min_per_cluster=limits["comentors_min"], 
        max_per_cluster=limits["comentors_max"]
    )

    # 7. Write to MongoDB
    print("Writing groups to MongoDB (Phase 1)...")
    num_clusters = len(centroids)
    
    # Clean up old groups and relations
    old_groups = list(db.Group.find({"academicYear": academic_year}))
    old_group_ids = [g['_id'] for g in old_groups]
    
    if old_group_ids:
        db.User.update_many(
            {"menteeIds": {"$in": old_group_ids}},
            {"$pull": {"menteeIds": {"$in": old_group_ids}}}
        )
        db.User.update_many(
            {"coMentorIds": {"$in": old_group_ids}},
            {"$pull": {"coMentorIds": {"$in": old_group_ids}}}
        )

    db.Group.delete_many({"academicYear": academic_year})
    
    for cluster_id in range(num_clusters):
        mentee_docs = df_juniors[df_juniors['cluster_id'] == cluster_id]
        mentee_ids = mentee_docs['userId'].tolist()
        
        comentor_docs = df_comentors[df_comentors['assigned_cluster_id'] == cluster_id] if not df_comentors.empty else pd.DataFrame()
        comentor_ids = comentor_docs['_id'].tolist() if not comentor_docs.empty else []

        group_doc = {
            "academicYear": academic_year,
            "groupName": f"SMP-Group-{cluster_id + 1}",
            "menteeIds": mentee_ids,
            "coMentorIds": comentor_ids,
            "mentorId": None,
        }
        
        inserted_group = db.Group.insert_one(group_doc)
        group_id = inserted_group.inserted_id
        
        db.User.update_many({"_id": {"$in": mentee_ids}}, {"$set": {"smpRole": "MENTEE"}, "$push": {"menteeIds": group_id}})
        db.User.update_many({"_id": {"$in": comentor_ids}}, {"$set": {"smpRole": "CO_MENTOR"}, "$push": {"coMentorIds": group_id}})

    print(f"Successfully populated {num_clusters} Phase 1 SMP groups (Mentees & Co-Mentors).")

if __name__ == "__main__":
    run_allocation_pipeline()