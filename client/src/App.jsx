import React, { useContext } from "react";
import Login from "./pages/Login/page.jsx";
import VerifyRoll from "./pages/Login/VerifyRoll.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/navbar.jsx";
import Footer from "./components/layout/footer.jsx";
import Home from "./pages/Home/page.jsx";
import Contact from "./pages/Contact/page.jsx";
import WingPage from "./pages/Wing/page.jsx";
import Wings from "./pages/Wings/page.jsx";
import AuthState from "./context/auth/authState.jsx";
import AuthContext from "./context/auth/authContext.jsx";
import DashboardLayout from "./layout/DashboardLayout.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import Announcements from "./pages/student/Announcements.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageCourses from "./pages/admin/ManageCourses.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageResources from "./pages/admin/ManageResources.jsx";
import ManageAnnouncement from "./pages/admin/ManageAnnouncement.jsx";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute.jsx"


const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* public route  */}
      <Route path="/" element={<Home />} />
      <Route path="/contact-us" element={<Contact />} />
      <Route path="/wing/:wingId" element={<WingPage />} />
      <Route path="/wings" element={<Wings />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login-with-roll" element={<VerifyRoll />} />

      {/* student  */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["student", "SUPER_ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="courses" element={<MyCourses />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* admin  */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["SUPER_ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="manage-courses" element={<ManageCourses />} />
        <Route path="manage-users" element={<ManageUsers />} />
        <Route path="manage-resources" element={<ManageResources />} />
        <Route path="manage-announcements" element={<ManageAnnouncement />} />
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
              <Toaster />
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
