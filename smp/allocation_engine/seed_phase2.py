import os
import random
from pymongo import MongoClient
from faker import Faker
from bson import ObjectId
from dotenv import load_dotenv

fake = Faker('en_IN')
load_dotenv()

MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/mydb?directConnection=true")
DB_NAME = "mydb"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

BRANCHES_WITH_CODES = [
    ("Computer Science & Engineering", "CS"),
    ("Artificial Intelligence & Data Science", "AI"),
    ("Mathematics & Computing", "MC"),
    ("Electronics & Communication Engineering", "EC"),
    ("Electrical Engineering", "EE"),
    ("Mechanical Engineering", "ME"),
    ("Civil Engineering", "CE"),
    ("Chemical & Biochemical Engineering", "CB"),
    ("Metallurgical & Materials Engineering", "MM"),
    ("Engineering Physics", "PH"),
    ("Earth & Environmental Sciences", "ES"),
]

TECH = ["Web Dev", "App Dev", "Machine Learning", "Blockchain", "CyberSec", "IoT", "Game Dev", "Cloud Computing"]
SPORTS = ["Cricket", "Football", "Basketball", "Badminton", "Table Tennis", "Chess", "Volleyball", "Athletics"]
CULT = ["Dance", "Music", "Drama", "Fine Arts", "Photography", "Debating", "Quiz"]
LANGUAGES = ["C++", "Python", "Java", "JavaScript", "Rust", "Go", "TypeScript"]
HOBBIES = ["Reading", "Gaming", "Traveling", "Cooking", "Anime", "Movies", "Fitness"]
PREFERENCES = ["CORE", "NON_CORE", "NO_PREFERENCE"]

def seed_phase2():
    print("WARNING: Phase 2 seed does NOT clear the database.")
    print("It only appends new users for the second round of allocation.")
    
    users_to_insert = []
    responses_to_insert = []

    PASSWORD_HASH = "$2b$10$.B9WgHPUOqMgK08TDPHWoO0NiO.zdMHw.OfxWBcYS9zAgoyHflloy" # password123

    def generate_batch(year_prefix, start_idx, end_idx, role_prefix):
        for i in range(start_idx, end_idx):
            user_id = ObjectId()
            branch_idx = i % len(BRANCHES_WITH_CODES)
            roll_idx = (i // len(BRANCHES_WITH_CODES)) + 1
            chosen_branch, branch_code = BRANCHES_WITH_CODES[branch_idx]
            serial_num = str(roll_idx).zfill(2)
            roll_number = f"{year_prefix}01{branch_code}{serial_num}"

            if i == 0:
                # Dedicated easily memorable demo account
                full_name = f"Demo {role_prefix.capitalize()}"
                email = f"{role_prefix}_{roll_number.lower()}@iitp.ac.in"
            else:
                full_name = fake.name()
                first_name_raw = full_name.split()[0].lower()
                first_name_clean = ''.join(c for c in first_name_raw if c.isalnum()) or role_prefix
                email = f"{first_name_clean}_{roll_number.lower()}@iitp.ac.in"

            users_to_insert.append({
                "_id": user_id,
                "email": email,
                "passwordHash": PASSWORD_HASH,
                "rollNumber": roll_number,
                "name": full_name,
                "role": "STUDENT",
                "smpRole": "UNASSIGNED",
                "coMentorIds": [],
                "menteeIds": []
            })
            
            responses_to_insert.append({
                "_id": ObjectId(),
                "userId": user_id,
                "academicYear": "2026-2027",
                "branch": chosen_branch,
                "techInterests": random.sample(TECH, k=random.randint(1, 4)),
                "sportsInterests": random.sample(SPORTS, k=random.randint(0, 3)),
                "cultInterests": random.sample(CULT, k=random.randint(0, 2)),
                "languages": random.sample(LANGUAGES, k=random.randint(1, 3)),
                "hobbies": random.sample(HOBBIES, k=random.randint(1, 4)),
                "goals": ["Learn new tech", "Build projects", "Get an internship"],
                "preference": random.choice(PREFERENCES)
            })

    print("Phase 2: Generating 60 Third Years (Mentors)...")
    generate_batch("24", 0, 60, "mentor")

    print("Executing Bulk Inserts to MongoDB...")
    db.User.insert_many(users_to_insert)
    db.QuestionnaireResponse.insert_many(responses_to_insert)
    
    print(f"Phase 2 Seeded Successfully! Total New Users: {len(users_to_insert)}")
    print(f"Sample Mentor Login (Password: password123):")
    print(f"  - 3rd Year Mentor:    mentor_2401cs01@iitp.ac.in (Roll: 2401CS01)")

if __name__ == "__main__":
    seed_phase2()
