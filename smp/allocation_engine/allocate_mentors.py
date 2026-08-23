import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from config_loader import load_config
from encoder import preprocess_questionnaire_data
from allocator import assign_mentors_to_groups

load_dotenv()
MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/mydb?directConnection=true")
DB_NAME = "mydb"

def run_mentor_allocation():
    print("Connecting to MongoDB for Phase 2: Mentor Allocation...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    config = load_config()
    limits = config["group_limits"]
    
    # 1. Fetch System Configuration
    sys_config = db.SystemConfig.find_one()
    if not sys_config:
        print("Error: SystemConfig not found.")
        return
        
    academic_year = sys_config.get("currentAcademicYear", "2026-2027")
    y3_prefix = sys_config.get("thirdYearBatchPrefix")   

    if not y3_prefix:
        print("Error: 3rd year batch prefix is missing.")
        return

    # 2. Fetch Existing Groups
    groups = list(db.Group.find({"academicYear": academic_year}))
    if not groups:
        print("No groups found for the current academic year. Please run Phase 1 allocation first.")
        return
    
    print(f"Found {len(groups)} groups. Fetching Mentors (3rd Year)...")

    # 3. Fetch 3rd Year Mentors
    y3_users = list(db.User.find({"rollNumber": {"$regex": f"^{y3_prefix}"}}))
    df_mentors = pd.DataFrame(y3_users)
    
    if df_mentors.empty:
        print("No 3rd year mentors registered yet. Exiting.")
        return
        
    y3_ids = [u['_id'] for u in y3_users]
    
    mentor_res = pd.DataFrame(list(db.QuestionnaireResponse.find({
        "userId": {"$in": y3_ids},
        "academicYear": academic_year
    })))

    print(f"Loaded {len(df_mentors)} Mentors. Reconstructing group centroids...")

    # 4. Reconstruct Centroids from Group Mentees
    group_centroids = []
    # Collect all mentees to encode together for consistent feature columns
    all_mentee_ids = []
    for g in groups:
        all_mentee_ids.extend(g.get("menteeIds", []))
        
    all_mentee_res = list(db.QuestionnaireResponse.find({
        "userId": {"$in": all_mentee_ids},
        "academicYear": academic_year
    }))
    df_all_mentees = pd.DataFrame(all_mentee_res)
    X_all_mentees = preprocess_questionnaire_data(df_all_mentees, config["weights_juniors"]) if not df_all_mentees.empty else pd.DataFrame()
    
    for g in groups:
        m_ids = g.get("menteeIds", [])
        if m_ids and not X_all_mentees.empty:
            # Find the indices in df_all_mentees that belong to this group
            # Assuming userId matches
            idx = df_all_mentees[df_all_mentees['userId'].isin(m_ids)].index
            if not idx.empty:
                centroid = X_all_mentees.loc[idx].mean(axis=0)
                group_centroids.append(centroid)
            else:
                group_centroids.append(pd.Series(dtype=float))
        else:
            group_centroids.append(pd.Series(dtype=float))
            
    centroids = pd.DataFrame(group_centroids).fillna(0)

    # 5. Encode Mentor Features
    print("Encoding mentor features...")
    X_mentors = preprocess_questionnaire_data(mentor_res, config["weights_seniors"]) if not mentor_res.empty else pd.DataFrame(index=df_mentors.index)
    
    # 6. Assign Mentors to Groups
    print("Assigning Mentors to groups...")
    max_groups = limits.get("max_groups_per_mentor", 2)
    
    df_mentors = assign_mentors_to_groups(
        X_mentors, df_mentors, centroids, 
        max_groups_per_mentor=max_groups
    )

    # 7. Update Database
    print("Writing mentor assignments to MongoDB...")
    
    # Reset existing mentor assignments in these groups if any
    db.Group.update_many({"academicYear": academic_year}, {"$set": {"mentorId": None}})
    # Reset previous mentors smpRole if needed
    
    # For each mentor, they have assigned_cluster_ids which correspond to the index in 'groups' list
    multi_group_mentors_count = 0
    for idx, row in df_mentors.iterrows():
        assigned_group_indices = row.get("assigned_cluster_ids", [])
        mentor_id = row["_id"]
        mentor_email = row.get("email", "Unknown")
        
        if len(assigned_group_indices) > 1:
            multi_group_mentors_count += 1
            print(f"  -> Mentor {mentor_email} assigned to {len(assigned_group_indices)} groups (Indices: {assigned_group_indices})")

        assigned_group_ids = []
        for g_idx in assigned_group_indices:
            group = groups[g_idx]
            g_id = group["_id"]
            assigned_group_ids.append(g_id)
            
            # Update the Group document
            db.Group.update_one({"_id": g_id}, {"$set": {"mentorId": mentor_id}})
            
        if assigned_group_ids:
            db.User.update_one(
                {"_id": mentor_id}, 
                {"$set": {"smpRole": "MENTOR"}}
            )

    print(f"Phase 2 Mentor Allocation complete. {multi_group_mentors_count} Mentors assigned to 2 groups!")

if __name__ == "__main__":
    run_mentor_allocation()
