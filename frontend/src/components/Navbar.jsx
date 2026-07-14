import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, GraduationCap, User, Shield, BookOpen } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">LearnDev</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-brand-500 ${
                    isActive ? "text-brand-500" : "text-gray-600 dark:text-gray-300"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg glass hover:bg-white/20 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {user.role === "admin" && (
                  <Link to="/admin/dashboard" className="flex items-center gap-1 text-sm font-medium text-brand-500">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/dashboard" className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> My Learning
                </Link>
                <Link to="/profile" className="p-2 rounded-full glass">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-5">
                  Get Started
                </Link>
              </div>
            )}

            <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="py-2 font-medium">
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="text-brand-500">Admin Panel</Link>
                  )}
                  <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  <button onClick={() => { logout(); setOpen(false); }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary text-center">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
