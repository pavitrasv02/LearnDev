const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const errorHandler = require("./middleware/errorHandler");
const logger = require("./config/logger");
const { register, metricsMiddleware } = require("./config/metrics");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const certificateRoutes = require("./routes/certificates");

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        // Allow Swagger UI to load its assets
        scriptSrcAttr: ["'none'"],
      },
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost"],
    credentials: true,
  })
);

// ── Body parsing + cookies ────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Structured HTTP request logging ──────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim(), { type: "http_access" }) },
  })
);

// ── Prometheus metrics middleware ─────────────────────────────────────────
app.use(metricsMiddleware);

// ── Global rate limiter ────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ── Health checks ─────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "olp-api", timestamp: new Date().toISOString() })
);

// ── Prometheus metrics (internal only — blocked by NGINX from public) ─────
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ── Swagger UI (/api/docs) ────────────────────────────────────────────────
app.use(
  "/api/docs",
  // Relax CSP for Swagger UI only
  (_req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "LearnDev API Docs",
    customCss: ".swagger-ui .topbar { background: #1f2937; }",
    swaggerOptions: { persistAuthorization: true },
  })
);

// ── Swagger spec JSON endpoint ────────────────────────────────────────────
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", certificateRoutes);

// ── Serve React SPA ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  if (
    req.path.startsWith("/api") ||
    req.path === "/metrics" ||
    req.path === "/health"
  ) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Central error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
