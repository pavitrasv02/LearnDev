import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [unverifiedEmail, setUnverifiedEmail] = useState(null); // for resend banner

  const { login, resendVerification } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get("session") === "expired";

  // ── Client-side validation ────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const data = await login(email, password);
      toast("Welcome back!", "success");
      const role = data.user?.role;
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      // Detect unverified-email block if the backend ever adds that check
      if (msg.toLowerCase().includes("verify")) {
        setUnverifiedEmail(email);
      }
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification email ─────────────────────────────────────────
  const handleResend = async () => {
    try {
      await resendVerification();
      toast("Verification email sent! Check your inbox.", "success");
    } catch {
      toast("Could not resend. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Session-expired banner */}
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            Your session has expired. Please sign in again.
          </motion.div>
        )}

        {/* Email-not-verified banner */}
        {unverifiedEmail && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your email is not verified.{" "}
              <button
                onClick={handleResend}
                className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100"
              >
                Resend verification email
              </button>
            </span>
          </motion.div>
        )}

        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue learning</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                    focus:ring-2 outline-none transition-shadow
                    ${errors.password ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                  autoComplete="current-password"
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
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <p className="text-center mt-5 text-xs text-gray-400">
            Demo — Admin: <span className="font-mono">admin@olp.dev / admin123</span> &nbsp;·&nbsp;
            Student: <span className="font-mono">demo@olp.dev / demo123</span>
          </p>

          <p className="text-center mt-3 text-sm">
            No account?{" "}
            <Link to="/signup" className="text-brand-500 font-medium hover:text-brand-600">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
