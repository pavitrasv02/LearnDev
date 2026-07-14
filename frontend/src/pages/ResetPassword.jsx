import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-400"];

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useParams();

  const validate = () => {
    const e = {};
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!confirm) e.confirm = "Please confirm your password";
    else if (confirm !== password) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      toast("Password reset! You can now sign in.", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed. The link may have expired.";
      toast(msg, "error");
      // If token is invalid/expired, guide back to forgot-password
      if (err.response?.status === 400) {
        setErrors({ token: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-8"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <AnimatePresence mode="wait">
          {/* ── Success state ─────────────────────────────────────────── */}
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Password updated!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Your password has been reset successfully. Sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full"
              >
                Go to Sign In
              </button>
            </motion.div>
          ) : (
            /* ── Form state ─────────────────────────────────────────── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  Enter your new password below.
                </p>
              </div>

              {/* Expired token error */}
              {errors.token && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-300">
                  {errors.token}{" "}
                  <Link to="/forgot-password" className="underline font-medium">
                    Request a new link
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New password */}
                <div>
                  <label className="block text-sm font-medium mb-2">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "", token: "" })); }}
                      placeholder="At least 6 characters"
                      className={`w-full pl-11 pr-11 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                        focus:ring-2 outline-none transition-shadow
                        ${errors.password ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                      autoComplete="new-password"
                      autoFocus
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
                    {password.length > 0 && (
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

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
                      placeholder="Repeat password"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                        focus:ring-2 outline-none transition-shadow
                        ${errors.confirm ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
