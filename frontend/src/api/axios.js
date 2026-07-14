import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send httpOnly refresh-token cookie on every request
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Silent-refresh state ──────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = []; // requests waiting while a refresh is in flight

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ── Response interceptor — handle 401 / 403 ──────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // ── Token expired — attempt one silent refresh ────────────────────────
    const isTokenExpired =
      err.response?.status === 401 &&
      (err.response?.data?.code === "TOKEN_EXPIRED" ||
        err.response?.data?.message === "Token expired") &&
      !original._retry;

    if (isTokenExpired) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken || data.token;
        localStorage.setItem("token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — clean up and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/signup")) {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Other 401 (not token-expired) — clean up ──────────────────────────
    if (err.response?.status === 401 && !original._retry) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const path = window.location.pathname;
      if (!path.includes("/login") && !path.includes("/signup")) {
        window.location.href = "/login";
      }
    }

    // ── Admin trying to access a forbidden route ───────────────────────────
    if (err.response?.status === 403 && window.location.pathname.startsWith("/admin")) {
      window.location.href = "/";
    }

    return Promise.reject(err);
  }
);

export default api;
