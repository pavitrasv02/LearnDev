import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { forgotPassword } = useAuth();
  const { toast } = useToast();

  const validate = () => {
    if (!email) { setError("Email is required"); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return false; }
    return true;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast("Reset link sent! Check your inbox.", "success");
    } catch (err) {
      // Backend always returns 200 for forgot-password, so this catches network errors
      toast(err.response?.data?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-8"
      >
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <AnimatePresence mode="wait">
          {/* ── Success state ─────────────────────────────────────────── */}
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Check your inbox</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                We sent a password reset link to
              </p>
              <p className="font-semibold text-brand-500 mb-6">{email}</p>
              <p className="text-sm text-gray-400 mb-8">
                The link expires in <strong>10 minutes</strong>. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                Didn't receive it? Send again
              </button>
            </motion.div>
          ) : (
            /* ── Form state ─────────────────────────────────────────── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-medium mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0
                        focus:ring-2 outline-none transition-shadow
                        ${error ? "ring-2 ring-red-400" : "focus:ring-brand-500"}`}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <p className="text-center mt-6 text-sm">
                Remembered it?{" "}
                <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
