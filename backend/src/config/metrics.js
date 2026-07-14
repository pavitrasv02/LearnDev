/**
 * Prometheus metrics configuration.
 * Exposes /metrics endpoint for Prometheus scraping.
 * Tracks: HTTP requests, response duration, Redis cache hit/miss, active connections.
 */
const client = require("prom-client");

// Create a dedicated registry (avoids conflicts when running tests)
const register = new client.Registry();

// Collect default Node.js metrics: CPU, memory, event loop lag, GC, etc.
client.collectDefaultMetrics({
  register,
  prefix: "olp_",
  labels: { service: "olp-api" },
});

// ── HTTP request duration histogram ──────────────────────────────────────
const httpRequestDuration = new client.Histogram({
  name: "olp_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// ── HTTP request counter ──────────────────────────────────────────────────
const httpRequestTotal = new client.Counter({
  name: "olp_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// ── Redis cache hit/miss counters ─────────────────────────────────────────
const cacheHits = new client.Counter({
  name: "olp_redis_cache_hits_total",
  help: "Total Redis cache hits",
  registers: [register],
});

const cacheMisses = new client.Counter({
  name: "olp_redis_cache_misses_total",
  help: "Total Redis cache misses",
  registers: [register],
});

// ── Active HTTP connections gauge ─────────────────────────────────────────
const activeConnections = new client.Gauge({
  name: "olp_active_connections",
  help: "Number of active HTTP connections",
  registers: [register],
});

// ── Express middleware: measure every request ─────────────────────────────
/**
 * Attach to Express: app.use(metricsMiddleware)
 * Normalises route patterns (removes ObjectIds) to avoid label explosion.
 */
function metricsMiddleware(req, res, next) {
  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    // Normalise dynamic segments: /api/courses/64abc123 → /api/courses/:id
    const route = req.route?.path
      ? `${req.baseUrl || ""}${req.route.path}`
      : req.path.replace(/\/[0-9a-f]{24}/gi, "/:id").replace(/\/[0-9]+/g, "/:id");

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    end(labels);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
}

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  cacheHits,
  cacheMisses,
  activeConnections,
  metricsMiddleware,
};
