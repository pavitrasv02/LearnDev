import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminMobileNav from "./components/AdminMobileNav";

const titles = {
  "/admin": "Dashboard",
  "/admin/dashboard": "Dashboard",
  "/admin/courses": "Course Management",
  "/admin/users": "User Management",
  "/admin/enrollments": "Enrollment Management",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  // Builder route: /admin/courses/:id/builder
  const isBuilder = location.pathname.includes("/builder");
  const title = isBuilder ? "Course Builder" : (titles[location.pathname] || "Admin");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
          success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
        }}
      />
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} onMenuClick={() => setCollapsed(!collapsed)} />
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
        <AdminMobileNav />
      </div>
    </div>
  );
}
