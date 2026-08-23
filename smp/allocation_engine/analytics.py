import os
import json
import random
from collections import Counter
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/mydb?directConnection=true")
DB_NAME = "mydb" 

def run_analytics():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("--- SMP Allocation Analytics ---")
    
    # 1. Fetch System Config for Prefixes
    sys_config = db.SystemConfig.find_one()
    if not sys_config:
        print("SystemConfig not found. Exiting.")
        return
        
    academic_year = sys_config.get("currentAcademicYear")
    y1_prefix = sys_config.get("firstYearBatchPrefix")
    y2_prefix = sys_config.get("secondYearBatchPrefix")
    y3_prefix = sys_config.get("thirdYearBatchPrefix")

    # 2. Unassigned Statistics
    unassigned_y1 = db.User.count_documents({"rollNumber": {"$regex": f"^{y1_prefix}"}, "smpRole": "UNASSIGNED", "role": "STUDENT"})
    unassigned_y2 = db.User.count_documents({"rollNumber": {"$regex": f"^{y2_prefix}"}, "smpRole": "UNASSIGNED", "role": "STUDENT"})
    unassigned_y3 = db.User.count_documents({"rollNumber": {"$regex": f"^{y3_prefix}"}, "smpRole": "UNASSIGNED", "role": "STUDENT"})
    
    print("\n[1] Unassigned Students:")
    print(f"  - 1st Years (Mentees):   {unassigned_y1}")
    print(f"  - 2nd Years (Co-Mentors): {unassigned_y2}")
    print(f"  - 3rd Years (Mentors):   {unassigned_y3}")

    # 3. Group Distribution Stats
    groups = list(db.Group.find({"academicYear": academic_year}))
    total_groups = len(groups)
    
    if total_groups == 0:
        print("No groups found for the current academic year.")
        return

    mentee_counts = [len(g.get("menteeIds", [])) for g in groups]
    comentor_counts = [len(g.get("coMentorIds", [])) for g in groups]
    mentor_counts = [1 if g.get("mentorId") else 0 for g in groups]

    print(f"\n[2] Group Distributions (Total Groups: {total_groups}):")
    print(f"  - Mentees per group:    Max: {max(mentee_counts)}, Min: {min(mentee_counts)}")
    print(f"  - Co-Mentors per group: Max: {max(comentor_counts)}, Min: {min(comentor_counts)}")
    print(f"  - Mentors per group:    Max: {max(mentor_counts)}, Min: {min(mentor_counts)}")

    # 4. Branch Integrity Check
    print("\n[3] Branch Integrity Check:")
    mixed_branch_groups = 0
    
    for g in groups:
        # Collect all user IDs in this group
        all_member_ids = g.get("menteeIds", []) + g.get("coMentorIds", [])
        if g.get("mentorId"):
            all_member_ids.append(g.get("mentorId"))
            
        # Fetch their questionnaire responses to check their branches
        responses = list(db.QuestionnaireResponse.find({"userId": {"$in": all_member_ids}}))
        branches = set([res.get("branch") for res in responses if res.get("branch")])
        
        if len(branches) > 1:
            mixed_branch_groups += 1

    if mixed_branch_groups == 0:
        print("  - SUCCESS: 0 groups have mixed branches. The clustering weights worked perfectly!")
    else:
        print(f"  - WARNING: {mixed_branch_groups} groups contain members from multiple branches. You may need to increase the 'branch' weight in config.json.")

    # 5. Deep Dive: Dump 5 Random Groups
    print("\n[4] Generating Deep Dive Report...")
    sample_size = min(5, total_groups)
    sample_groups = random.sample(groups, sample_size)
    dump_data = []

    def fetch_full_user_data(user_id):
        if not user_id: return None
        user = db.User.find_one({"_id": user_id}, {"passwordHash": 0}) # Exclude password
        response = db.QuestionnaireResponse.find_one({"userId": user_id})
        
        if user: user['_id'] = str(user['_id'])
        if response:
            response['_id'] = str(response['_id'])
            response['userId'] = str(response['userId'])
            
        return {"profile": user, "questionnaire": response}

    for g in sample_groups:
        group_detail = {
            "groupId": str(g["_id"]),
            "groupName": g.get("groupName"),
            "mentor": fetch_full_user_data(g.get("mentorId")),
            "coMentors": [fetch_full_user_data(cid) for cid in g.get("coMentorIds", [])],
            "mentees": [fetch_full_user_data(mid) for mid in g.get("menteeIds", [])]
        }
        dump_data.append(group_detail)

    output_file = "sample_groups_dump.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dump_data, f, indent=2, default=str)
        
    print(f"  - Saved detailed data for {sample_size} groups to '{output_file}'.")

if __name__ == "__main__":
    run_analytics()