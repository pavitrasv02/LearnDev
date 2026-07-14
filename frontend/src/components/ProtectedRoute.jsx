import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./Skeleton";

/**
 * ProtectedRoute
 * - Redirects to /login if not authenticated.
 * - Shows a dismissible banner if email is unverified (non-blocking).
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, resendVerification } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      /* silently ignore — user can try again */
    } finally {
      setResending(false);
    }
  };

  const showBanner = !user.isEmailVerified && !bannerDismissed;

  return (
    <>
      {showBanner && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {resent ? (
                <span>Verification email sent! Check your inbox.</span>
              ) : (
                <span>
                  Your email is not verified.{" "}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-amber-500 hover:text-amber-700 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
