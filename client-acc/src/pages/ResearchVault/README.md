# Research Vault Administration Panel

The **Research Vault Admin Panel** (`ResearchVaultAdmin.jsx`) is the centralized React dashboard used by administrators to moderate, manage, and analyze all academic content across the Academic & Career Council (ACC) platform.

This document provides a detailed breakdown of the 8 core modules within the dashboard, what they do, and how data flows through them.

---

## 🛠️ System Architecture & Data Flow

The admin panel is built as a Single Page Application (SPA) component. 
- **Routing/State:** It uses a single React state variable (`tab`) to instantly switch between modules without reloading the page.
- **Data Fetching:** Upon loading, it uses a `Promise.all` block to concurrently fetch all required data (analytics, faculty list, open positions, moderation queues) from the `researchVaultApi`.
- **Forms & Actions:** All forms use standard HTML `FormData` for clean payload extraction. Destructive actions (like Reject or Delete) trigger immediate database updates via `PATCH` or `DELETE` requests.

---

## 📂 1. Overview (Analytics Dashboard)
**What it does:** 
Provides a high-level, bird's-eye view of everything happening in the Vault. It displays Key Performance Indicators (KPIs) like total faculty profiles, published experiences, and active discussions.

**How it works (Flow):**
1. Admin clicks the **Overview** tab.
2. The frontend hits the `/api/analytics` endpoint.
3. The backend aggregates counts from all major database tables (`FacultyProfile`, `StudentResearchExperience`, `ResearchDiscussion`, `ResearchResource`).
4. It calculates the "Top 5" most viewed faculty and resources.
5. The frontend renders these statistics into visual KPI cards and leaderboard lists.

---

## 🛡️ 2. Experiences (Moderation Queue)
**What it does:** 
Acts as a gatekeeper for student-submitted Research Experiences. Students review their internships or thesis projects, but they don't go live until an admin approves them here.

**How it works (Flow):**
1. A student submits a form on the public site. The backend saves the record with `status: PENDING_REVIEW`.
2. The admin dashboard displays an amber badge on the "Experiences" tab with the count of pending items.
3. Admin clicks **Approve**: A `PATCH` request is sent, updating the status in the database to `APPROVED`. The experience instantly appears on the public student portal.
4. Admin clicks **Reject**: A `PATCH` request is sent updating the status to `REJECTED` (hiding it permanently) or deleting the record entirely.

---

## 📄 3. Pending Resources (Resource Queue)
**What it does:** 
A moderation queue for community-suggested academic resources (papers, datasets, guides, GitHub repositories).

**How it works (Flow):**
1. A user submits a URL or uploads a file via the public "Submit Resource" form. It saves as `PENDING`.
2. The admin reviews the submitted URL or file directly from the queue cards.
3. **Approve:** Updates the database status to `APPROVED`, moving the item into the active public library.
4. **Reject:** Discards the submission.

---

## 👨‍🏫 4. Faculty (Directory Management)
**What it does:** 
Manages the active directory of professors, principal investigators, and researchers.

**How it works (Flow):**
1. **Create:** Admin fills out the "Add Faculty" form (Name, Designation, Email, Lab Website, Photo).
2. The frontend sends a `multipart/form-data` POST request to the backend.
3. The backend securely stores the photo (if provided) and saves the profile to the `FacultyProfile` table.
4. **Delete:** Clicking the delete button sends a `DELETE` request, entirely removing the professor from the database.

---

## 📚 5. Resources (Active Library)
**What it does:** 
Allows admins to bypass the moderation queue and directly upload official resources or external links to the public library.

**How it works (Flow):**
1. Admin fills out the resource form (Title, Type, Tags).
2. Admin can either provide an **External URL** or **Upload a File** (PDF, Doc).
3. The frontend packages this as `FormData` and sends it to the backend.
4. The backend stores the file in cloud/local storage, generates a secure URL, attaches the provided tags, and saves it directly to the database with an `APPROVED` status.

---

## 💼 6. Open Positions (Opportunities Board)
**What it does:** 
A job board for advertising Research Assistantships, Summer Internships, and Thesis slots. Note: This acts purely as a *bulletin board*, not an Applicant Tracking System.

**How it works (Flow):**
1. **Creation:** Admin creates a position, specifying the deadline and linking an external `applicationUrl` (like a Google Form) or instructions (like "Email Professor X").
2. **Student Flow:** Students view the listing on the public site and click the link to apply *externally*. The ACC website does not collect the applications.
3. **Closing:** The listing remains visible to students until the **Deadline** passes in the database, OR until the admin manually clicks the **"Close"** button on the admin card to prematurely hide it.

---

## 🏷️ 7. Research Areas (Taxonomy Management)
**What it does:** 
Manages the master list of categories (e.g., "Artificial Intelligence", "Robotics", "Quantum Computing") used to tag Faculty, Resources, and Positions.

**How it works (Flow):**
1. **Create:** Admin types a new area name.
2. The backend receives the string, automatically sanitizes it into a URL-friendly slug (`Machine Learning` -> `machine-learning`), and saves it to the `ResearchArea` table.
3. **Delete Protection:** If a Research Area is currently linked to an active Faculty member or Resource, the database will block the deletion to prevent broken links on the public site.

---

## 🔧 8. Custom Areas (User Requests)
**What it does:** 
When students submit resources, they might need a category that doesn't exist yet (e.g., "Neuromorphic Engineering"). They can suggest a "Custom Area." Those requests land here for admin resolution.

**How it works (Flow):**
1. Admin reviews the student's custom string request alongside the resource they were trying to upload.
2. **Create New Area:** Admin decides the tag is useful. The backend converts the custom string into a brand new, permanent `ResearchArea` for everyone to use, and links the student's resource to it.
3. **Map to Existing:** Admin decides the tag is a duplicate (e.g., "Neural Nets" should just be "AI"). They select "AI" from a dropdown. The backend discards the custom string and updates the student's resource to point to the official "AI" tag instead.
