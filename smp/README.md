# Student Mentorship Program (SMP) Platform

The Student Mentorship Program (SMP) platform is a full-stack web application designed to manage student registration, collect preferences via questionnaires, and execute a smart allocation engine to match Mentees (1st Years), Co-Mentors (2nd Years), and Mentors (3rd Years) into mentorship groups.

## System Architecture

- **Frontend:** React (Vite) styled with Tailwind CSS, using a classic minimal premium UI design.
- **Backend:** Node.js + Express using Prisma ORM with MongoDB.
- **Reverse Proxy / Load Balancer:** Nginx handles request routing and serves frontend assets.
- **Object Storage:** MinIO manages user-uploaded media.
- **Database:** MongoDB (configured as a single-node replica set to support Prisma transactions).
- **Allocation Engine:** Python script used to cluster students and write to the database.

---

## ⚠️ IMPORTANT INSTRUCTION FOR ALL TEAM MEMBERS

**DO NOT MODIFY ANY CODE IN THE `allocation_engine` DIRECTORY.**

The Allocation Engine has been fully implemented, rigorously tested, and is working perfectly. Any modifications to its core logic could break the mentorship grouping system. 

The only useful files you need to interact with in the `allocation_engine` directory are:
1. `main.py` - This is the core engine script. When executed, it pulls registered users, clusters them, and populates the database with finalized `Group` objects.
2. `seed_phase1.py` and `seed_phase2.py` - These are testing scripts. They programmatically generate dummy students (Mentees, Co-Mentors, and Mentors) and inject them into the system so you can test the `main.py` allocation process. `seed_phase1.py` generates the initial batch, and `seed_phase2.py` appends more students for the second round of allocation.

---

## Setup & Running the Project from Scratch

Follow these instructions exactly to get the project running locally.

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js (v20+)](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/)
- [Python 3.10+](https://www.python.org/) (for the allocation engine)

---

### Step 1: Install Frontend Dependencies & Build
Nginx serves the frontend assets directly from the compiled `./client/dist` folder. You must build the frontend locally first.

```bash
# Move into the frontend directory
cd client

# Install NPM dependencies
npm install

# Build the React application for production
npm run build

# Go back to the root directory
cd ..
```

### Step 2: Configure Environment Variables
You need a `.env` file in the `server` directory to hold backend secrets. 
Create `server/.env` and add the following:

```env
PORT=3000
DATABASE_URL="mongodb://database:27017/mydb?authSource=admin&directConnection=true"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin123"
MINIO_BUCKET_NAME="smp-media"
JWT_SECRET="your_secure_jwt_secret_key"
```

You also need a `.env` file in the `allocation_engine` directory for the Python script to connect to the DB.
Create `allocation_engine/.env` and add:

```env
DATABASE_URL="mongodb://localhost:27017/mydb?authSource=admin&directConnection=true"
```
*(Note: Use `localhost` here because you will run the Python scripts directly from your host machine, outside of Docker).*

### Step 3: Run Docker Compose
Now, spin up the entire backend infrastructure (Node Server, MongoDB, MinIO, and Nginx).

```bash
# Build and start all containers in the background
docker compose up -d --build
```

### Step 4: Initialize the MongoDB Replica Set
Prisma requires MongoDB to be running as a replica set to allow transactions. Run this command to initialize it inside the running MongoDB container:

```bash
docker exec smp-mongo mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'database:27017'}]})"
```

### Step 5: Seed the Backend Configurations
The Node.js backend needs an initial System Config document and a default Admin user.

```bash
# Run the backend seed script
docker compose exec backend node seed.js
```

### Step 6: Accessing the Application
Your application is now fully running!
- **Web Portal (Frontend):** [http://localhost](http://localhost)
- **MinIO Console (Storage):** [http://localhost:9001](http://localhost:9001)

**Default Admin Login:**
- Email: `admin@iitp.ac.in`
- Password: `admin123`

---

## Testing the Full Application Flow

Once the application is running, here is how the entire system flows from start to finish.

### 1. User Registration & Onboarding
- As an **Admin**, log in to the portal and ensure "Registration Open" is toggled on in System Configs.
- Students visit the web portal, sign up, and fill out the Onboarding Questionnaire.
- Alternatively, **for testing purposes**, you can instantly simulate hundreds of students registering by running the Python seed scripts:
  
  ```bash
  # Go to the allocation engine folder
  cd allocation_engine
  
  # Create a virtual environment and install requirements
  python -m venv venv
  
  # Activate venv (Windows)
  venv\Scripts\activate
  # OR Activate venv (Mac/Linux)
  # source venv/bin/activate
  
  pip install -r requirements.txt
  
  # Run the phase 1 seed script to populate hundreds of dummy users
  python seed_phase1.py
  ```

### 2. Running the Allocation Engine
- Once all students have registered (or you've seeded them), the Admin closes registration in the Admin Portal.
- The Admin then runs the Allocation Engine script manually on the server to form the groups:

  ```bash
  # Ensure you are still in the activated virtual environment
  python main.py
  ```
- This script reads all unassigned 1st and 2nd year users, groups them based on compatibility (tech interests, languages, etc.), and writes the final `Group` collections to the database (with mentors left as `null`).

### 3. Phase 2: Mentor Allocation
- To simulate the second phase, run the phase 2 seed script to populate the 3rd year mentors:
  ```bash
  python seed_phase2.py
  ```
- Then, run the mentor allocation engine to assign them to the groups (up to 2 groups per mentor):
  ```bash
  python allocate_mentors.py
  ```

### 4. Finalizing Allocation
- As the **Admin**, go back to the Admin Dashboard System Configs and toggle "Allocation Complete" to true.
- Students can now log into their accounts (or automatically refresh if they were on the waiting page) to see their assigned Mentor, Co-Mentors, and fellow Mentees on their personalized dashboard!
