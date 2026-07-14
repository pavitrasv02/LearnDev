import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, CheckCircle, BookOpen, Code } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── Password strength helper ──────────────────────────────────────────────
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-4
}
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-400"];

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registered, setRegistered] = useState(false); // post-registration state

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast("Account created! Check your email to verify your address.", "success");
      setRegistered(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      // Show field-level errors from server
      if (err.response?.data?.errors) {
        const fieldErrs = {};
        err.response.data.errors.forEach(({ field, message }) => { fieldErrs[field] = message; });
        setErrors(fieldErrs);
      } else {
        toast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  // ── Post-registration success screen ──────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 w-full max-w-md text-center"
        >
          <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Check your inbox</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            We sent a verification link to
          </p>
          <p className="font-semibold text-brand-500 mb-6">{form.email}</p>
          <p className="text-sm text-gray-400 mb-8">
            Click the link in that email to activate your account. The link expires in 24 hours.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary w-full mb-3"
          >
            Continue to Dashboard
          </button>
          <p className="text-sm text-gray-500">
            Wrong email?{" "}
            <button
              onClick={() => setRegistered(false)}
              className="text-brand-500 font-medium hover:text-brand-600"
            >
              Go back
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Start your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "student", label: "Learn", icon: BookOpen, desc: "Enroll & take courses" },
                { value: "instructor", label: "Teach", icon: Code, desc: "Create & publish courses" },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all text-center
                    ${form.role === value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-brand-300"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${form.role === value ? "text-brand-500" : "text-gray-400"}`} />
                  <span className={`font-semibold text-sm ${form.role === value ? "text-brand-600 dark:text-brand-400" : ""}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Jane Doe"
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                  focus:ring-2 outline-none transition-shadow
                  ${errors.name ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                  focus:ring-2 outline-none transition-shadow
                  ${errors.email ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
                className={`w-full pl-11 pr-11 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                  focus:ring-2 outline-none transition-shadow
                  ${errors.password ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Strength bar */}
            <AnimatePresence>
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300
                          ${strength >= i ? strengthColor[strength] : "bg-gray-200 dark:bg-gray-700"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Strength:{" "}
                    <span className={`font-medium ${
                      strength <= 1 ? "text-red-500" :
                      strength === 2 ? "text-amber-500" :
                      strength === 3 ? "text-blue-500" : "text-green-500"
                    }`}>
                      {strengthLabel[strength] || ""}
                    </span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Have an account?{" "}
          <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
