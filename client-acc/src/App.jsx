import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context & Higher-Order Providers
import AuthState from "./context/auth/authState.jsx";
import SmoothScroll from "./components/layout/SmoothScroll.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Layout & UI Components
import Navbar from "./components/layout/navbar.jsx";
import Footer from "./components/layout/footer.jsx";
import AuroraBackground from "./components/layout/AuroraBackground.jsx";
import DashboardLayout from "./layout/DashboardLayout.jsx";

// Public Pages
import Home from "./pages/Home/page.jsx";
import AccTeam from "./pages/Team/page.jsx";
import DevTeam from "./pages/Developers/page.jsx";
import AdminTeam from "./pages/adminSection/page.jsx";
import WingPage from "./pages/Wing/page.jsx";
import Wings from "./pages/Wings/page.jsx";
import FAQPage from "./pages/FAQ/page.jsx";
import SignIn from "./pages/Login/page.jsx";
import SignUp from "./pages/Signup/page.jsx";
import VerifyRoll from "./pages/Login/VerifyRoll.jsx";

// Student Portal Pages
import MyCourses from "./pages/student/MyCourses.jsx";
import ChooseResource from "./pages/student/ChooseResource.jsx";
import CourseResources from "./pages/student/courseResources.jsx";
import Announcements from "./pages/student/Announcements.jsx";
import CareerVault from "./pages/CareerVaultuser/index.jsx";
import FinanceVault from "./pages/FinanceVault/index.jsx";
import ScholarshipDetails from "./pages/FinanceVault/ScholarshipDetails.jsx";
import LevelUp from "./pages/student/LevelUp.jsx";
import DoubtForum from "./pages/DoubtForum/index.jsx";
import AskDoubt from "./pages/DoubtForum/AskDoubt.jsx";
import DoubtThread from "./pages/DoubtForum/DoubtThread.jsx";

// ACC Wiki Module
import WikiHome from "./pages/Wiki";
import ManageWiki from "./pages/admin/ManageWiki";

// Admin Portal Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageCourses from "./pages/admin/ManageCourses.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageResources from "./pages/admin/ManageResources.jsx";
import ManageAnnouncement from "./pages/admin/ManageAnnouncement.jsx";
import ManagePost from "./pages/admin/ManagePost.jsx";
import AdminPostEditor from "./components/Editor.jsx";
import FinanceDashboard from "./pages/FinanceVault/admin/Dashboard.jsx";
import AddScholarship from "./pages/FinanceVault/admin/AddScholarship.jsx";
import EditScholarship from "./pages/FinanceVault/admin/EditScholarship.jsx";
import ManageRoadmap from "./pages/admin/ManageRoadmap.jsx";
import ManageDoubts from "./pages/admin/ManageDoubts.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/team" element={<AccTeam />} />
      <Route path="/devs" element={<DevTeam />} />
      <Route path="/administrators" element={<AdminTeam />} />
      <Route path="/wing/:wingId" element={<WingPage />} />
      <Route path="/wings" element={<Wings />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/wiki" element={<WikiHome />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/login-with-roll" element={<VerifyRoll />} />

      {/* Student Portal */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            roles={[
              "STUDENT",
              "SUPER_ADMIN",
              "ANNOUNCEMENT_ADMIN",
              "RESOURCE_ADMIN",
              "FACULTY",
              "CAREER_ADMIN",
              "FINANCE_ADMIN",
              "WIKI_ADMIN",
            ]}
          >
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="courses" element={<MyCourses />}>
          <Route path=":id" element={<ChooseResource />}>
            <Route path=":key" element={<CourseResources />} />
          </Route>
        </Route>
        <Route path="announcements" element={<Announcements />} />
        <Route path="career-vault" element={<CareerVault />} />
        <Route path="finance-vault" element={<FinanceVault />} />
        <Route path="finance-vault/:id" element={<ScholarshipDetails />} />
        <Route path="wiki" element={<WikiHome />} />
        <Route path="level-up" element={<LevelUp />} />
        <Route path="level-up/:roadmapSlug/:chapterSlug" element={<LevelUp />} />

        {/* ACC Wiki: doubt forum */}
        <Route path="doubts" element={<DoubtForum />} />
        <Route path="doubts/ask" element={<AskDoubt />} />
        <Route path="doubts/:id" element={<DoubtThread />} />
        <Route path="doubts/:id/edit" element={<AskDoubt />} />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            roles={[
              "SUPER_ADMIN",
              "ANNOUNCEMENT_ADMIN",
              "RESOURCE_ADMIN",
              "FACULTY",
              "CAREER_ADMIN",
              "FINANCE_ADMIN",
              "WIKI_ADMIN",
            ]}
          >
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <ProtectedRoute
              roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-courses"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}>
              <ManageCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-users"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "FACULTY"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-resources"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}>
              <ManageResources />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-announcements"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "FACULTY"]}>
              <ManageAnnouncement />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-posts"
          element={
            <ProtectedRoute
              roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "FACULTY", "CAREER_ADMIN"]}
            >
              <ManagePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-wiki"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "WIKI_ADMIN"]}>
              <ManageWiki />
            </ProtectedRoute>
          }
        />
        <Route
          path="editor"
          element={
            <ProtectedRoute
              roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "FACULTY", "CAREER_ADMIN"]}
            >
              <AdminPostEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-vault"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-vault/add"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}>
              <AddScholarship />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance-vault/edit/:id"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}>
              <EditScholarship />
            </ProtectedRoute>
          }
        />
        <Route
          path="level-up"
          element={
            <ProtectedRoute
              roles={[
                "SUPER_ADMIN",
                "ANNOUNCEMENT_ADMIN",
                "RESOURCE_ADMIN",
                "FACULTY",
                "CAREER_ADMIN",
                "FINANCE_ADMIN",
              ]}
            >
              <ManageRoadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-doubts"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "FACULTY"]}>
              <ManageDoubts />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

const AppContent = () => {
  const location = useLocation();
  const overlapPages = [
    "/",
    "/wings",
    "/team",
    "/administrators",
    "/devs",
    "/faq",
    "/login",
    "/register",
    "/login-with-roll",
  ];
  const isOverlap =
    overlapPages.includes(location.pathname) || location.pathname.startsWith("/wing/");
  const isDashboard =
    location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen text-slate-900 selection:bg-blue-200 selection:text-slate-900 relative">
      <AuroraBackground />
      <Navbar />

      <main className={`grow ${isOverlap ? "" : "pt-16"}`}>
        <Toaster position="top-right" />
        <AppRoutes />
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <AuthState>
          <AppContent />
        </AuthState>
      </SmoothScroll>
    </BrowserRouter>
  );
};

export default App;