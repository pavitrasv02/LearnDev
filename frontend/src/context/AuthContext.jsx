import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // ── Boot: rehydrate session on page load ────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        // /me failed even after silent refresh attempt — clear state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const token = data.accessToken || data.token;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (name, email, password, role = "student") => {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    const token = data.accessToken || data.token;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore — clear local state regardless */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // ── Forgot password ──────────────────────────────────────────────────────
  const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  };

  // ── Reset password ───────────────────────────────────────────────────────
  const resetPassword = async (token, password) => {
    const { data } = await api.patch(`/auth/reset-password/${token}`, { password });
    return data;
  };

  // ── Verify email via token in URL ────────────────────────────────────────
  const verifyEmail = async (token) => {
    const { data } = await api.get(`/auth/verify-email/${token}`);
    // Update local user state if they're logged in
    if (user) {
      const updated = { ...user, isEmailVerified: true };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    }
    return data;
  };

  // ── Resend verification email ─────────────────────────────────────────────
  const resendVerification = async () => {
    const { data } = await api.post("/auth/resend-verification");
    return data;
  };

  // ── Refresh user profile from server ─────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
