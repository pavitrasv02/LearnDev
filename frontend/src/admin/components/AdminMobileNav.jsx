import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, GraduationCap, Settings } from "lucide-react";

const links = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/admin/courses", icon: BookOpen, label: "Courses" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/enrollments", icon: GraduationCap, label: "Enroll" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminMobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 py-2 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${
              isActive ? "text-brand-400" : "text-gray-500"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
