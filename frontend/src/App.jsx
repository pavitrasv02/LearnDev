import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./admin/AdminRoute";
import AdminLayout from "./admin/AdminLayout";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LearnPage from "./pages/LearnPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";

import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminCourses from "./admin/pages/AdminCourses";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminEnrollments from "./admin/pages/AdminEnrollments";
import AdminSettings from "./admin/pages/AdminSettings";
import CourseBuilder from "./admin/pages/CourseBuilder";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/courses" element={<MainLayout><Courses /></MainLayout>} />
        <Route path="/courses/:slug" element={<MainLayout><CourseDetail /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/signup" element={<MainLayout><Signup /></MainLayout>} />
        <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
        <Route path="/reset-password/:token" element={<MainLayout><ResetPassword /></MainLayout>} />
        <Route path="/verify-email/:token" element={<MainLayout><VerifyEmail /></MainLayout>} />
        <Route path="/403" element={<MainLayout><AccessDenied /></MainLayout>} />

        {/* ── Protected ────────────────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <MainLayout>
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          </MainLayout>
        } />
        <Route path="/profile" element={
          <MainLayout>
            <ProtectedRoute><Profile /></ProtectedRoute>
          </MainLayout>
        } />

        {/* Learn page — full-screen, no Navbar/Footer */}
        <Route path="/learn/:slug" element={
          <ProtectedRoute><LearnPage /></ProtectedRoute>
        } />

        {/* ── Admin (no Navbar/Footer) ──────────────────────────────────── */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"   element={<AdminDashboard />} />
          <Route path="courses"     element={<AdminCourses />} />
          <Route path="courses/:courseId/builder" element={<CourseBuilder />} />
          <Route path="users"       element={<AdminUsers />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="settings"    element={<AdminSettings />} />
        </Route>

        {/* ── 404 catch-all ────────────────────────────────────────────── */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </div>
  );
}
