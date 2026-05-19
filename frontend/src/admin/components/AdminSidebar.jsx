import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/courses", icon: BookOpen, label: "Courses" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/enrollments", icon: GraduationCap, label: "Enrollments" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      className="hidden lg:flex flex-col flex-shrink-0 border-r border-gray-800/50 bg-gray-950/95 backdrop-blur-xl h-screen sticky top-0"
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
        {!collapsed && <span className="text-lg font-bold gradient-text">LearnDev Admin</span>}
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-brand-600/30 to-accent-violet/20 text-white border border-brand-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800/50 space-y-1">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
          <ExternalLink className="w-5 h-5" />
          {!collapsed && <span className="text-sm">View Site</span>}
        </a>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
