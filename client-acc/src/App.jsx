import React from "react";
import VerifyRoll from "./pages/Login/VerifyRoll.jsx";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/navbar.jsx";
import Footer from "./components/layout/footer.jsx";
import AuroraBackground from "./components/layout/AuroraBackground.jsx";
import SmoothScroll from "./components/layout/SmoothScroll.jsx";
import Home from "./pages/Home/page.jsx";
import AccTeam from "./pages/Team/page.jsx";
import WingPage from "./pages/Wing/page.jsx";
import Wings from "./pages/Wings/page.jsx";
import AuthState from "./context/auth/authState.jsx";
import DashboardLayout from "./layout/DashboardLayout.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import Announcements from "./pages/student/Announcements.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageCourses from "./pages/admin/ManageCourses.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageResources from "./pages/admin/ManageResources.jsx";
import ManageAnnouncement from "./pages/admin/ManageAnnouncement.jsx";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ChooseResource from "./pages/student/ChooseResource.jsx";
import CourseResources from "./pages/student/courseResources.jsx";
import SignIn from "./pages/Login/page.jsx";
import SignUp from "./pages/Signup/page.jsx";
import DevTeam from "./pages/Developers/page.jsx";
import AdminTeam from "./pages/adminSection/page.jsx";
import CareerVault from "./pages/CareerVaultuser/index.jsx";
import ManagePost from "./pages/admin/ManagePost.jsx";
import AdminPostEditor from "./components/Editor.jsx";
import FAQPage from "./pages/FAQ/page.jsx";
import FinanceVault from "./pages/FinanceVault/index.jsx";
import ScholarshipDetails from "./pages/FinanceVault/ScholarshipDetails.jsx";
import FinanceDashboard from "./pages/FinanceVault/admin/Dashboard.jsx";
import AddScholarship from "./pages/FinanceVault/admin/AddScholarship.jsx";
import EditScholarship from "./pages/FinanceVault/admin/EditScholarship.jsx";
const AppRoutes = () => {
  return (
    <Routes>
      {/* public route  */}
      <Route path="/" element={<Home />} />
      <Route path="/team" element={<AccTeam />} />
      <Route path="/devs" element={<DevTeam />} />
      <Route path="/administrators" element={<AdminTeam />} />
      <Route path="/wing/:wingId" element={<WingPage />} />
      <Route path="/wings" element={<Wings />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/login-with-roll" element={<VerifyRoll />} />

      {/* student  */}
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

<Route
  path="finance-vault/:id"
  element={<ScholarshipDetails />}
/>
      </Route>

      {/* admin  */}
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
              roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "RESOURCE_ADMIN", "FACULTY",]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-courses"
          element={
            <ProtectedRoute
              roles={["SUPER_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}
            >
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
            <ProtectedRoute
              roles={["SUPER_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}
            >
              <ManageResources />
             </ProtectedRoute>
          }
        />
        <Route
          path="manage-announcements"
          element={
            <ProtectedRoute
              roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "FACULTY"]}
            >
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
    <ProtectedRoute
      roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}
    >
      <FinanceDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="finance-vault/add"
  element={
    <ProtectedRoute
      roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}
    >
      <AddScholarship />
    </ProtectedRoute>
  }
/>

<Route
  path="finance-vault/edit/:id"
  element={
    <ProtectedRoute
      roles={["SUPER_ADMIN", "FINANCE_ADMIN"]}
    >
      <EditScholarship />
    </ProtectedRoute>
  }
/>
      </Route>
     
    </Routes>
  );
};

const AppContent = () => {
  const location = useLocation();
  const overlapPages = ["/", "/wings", "/team", "/administrators", "/devs", "/faq", "/login", "/register", "/login-with-roll"];
  const isOverlap = overlapPages.includes(location.pathname) || location.pathname.startsWith("/wing/");
  const isDashboard = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/admin");

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
