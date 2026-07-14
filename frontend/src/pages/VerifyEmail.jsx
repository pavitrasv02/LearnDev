import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const { token } = useParams();
  const { verifyEmail, resendVerification, user } = useAuth();

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Run verification as soon as the page mounts
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "The verification link is invalid or has expired."
        );
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      /* toast handled inside AuthContext would override — show inline */
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-10 text-center"
      >
        {/* ── Loading ─────────────────────────────────────────────────── */}
        {status === "loading" && (
          <>
            <div className="inline-flex p-4 rounded-full bg-brand-100 dark:bg-brand-900/30 mb-6">
              <Loader className="w-10 h-10 text-brand-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Verifying your email…</h2>
            <p className="text-gray-500 dark:text-gray-400">Please wait a moment.</p>
          </>
        )}

        {/* ── Success ─────────────────────────────────────────────────── */}
        {status === "success" && (
          <>
            <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Email verified!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="btn-primary inline-block px-8"
            >
              {user ? "Go to Dashboard" : "Sign In"}
            </Link>
          </>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {status === "error" && (
          <>
            <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Verification failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>

            {/* Resend option — only if the user is logged in */}
            {user && !user.isEmailVerified && (
              <div className="mb-6">
                {resent ? (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ New verification email sent. Check your inbox.
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn-primary flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
                  >
                    {resending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </button>
                )}
              </div>
            )}

            <Link
              to="/login"
              className="text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
