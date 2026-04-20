import React from "react";
import VerifyRoll from "./pages/Login/VerifyRoll.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/navbar.jsx";
import Footer from "./components/layout/footer.jsx";
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
import AdminTeam from "./pages/adminSection/page.jsx"
import CareerVault from "./pages/CareerVaultuser/index.jsx";

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
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/login-with-roll" element={<VerifyRoll />} />
      <Route path="/career-vault" element={<CareerVault />} />

      {/* student  */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            roles={[
              "STUDENT",
              "SUPER_ADMIN",
              "ANNOUNCEMENT_ADMIN",
              "RESOURCE_ADMIN"
            ]}
          >
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="courses" element={<MyCourses />} >
          <Route path=":id" element={<ChooseResource/>}>
            <Route path=":key" element={<CourseResources/>}/>
          </Route>
        </Route>
        <Route path="announcements" element={<Announcements />} />
        <Route path="career-vault" element={<CareerVault />} />
      </Route>

      {/* admin  */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            roles={["SUPER_ADMIN", "ANNOUNCEMENT_ADMIN", "RESOURCE_ADMIN", "FACULTY"]}
          >
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
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
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <>
      <BrowserRouter>
        <AuthState>
          <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-grow pt-16">
              <Toaster position="top-right" />
              <AppRoutes />
            </main>

            <Footer />
          </div>
        </AuthState>
      </BrowserRouter>
    </>
  );
};

export default App;
