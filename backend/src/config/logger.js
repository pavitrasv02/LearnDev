/**
 * Structured Winston logger.
 *
 * - In development: pretty-printed coloured console output.
 * - In production: JSON to stdout (for Docker log drivers / Loki) +
 *   rotating file transports in logs/ directory.
 *
 * Log levels:
 *   error, warn, info, http, verbose, debug
 *
 * Every log entry includes:
 *   { timestamp, level, message, service, environment, ...meta }
 *
 * Loki/ELK compatible — JSON format with consistent label set.
 */
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists (only matters when file transport is used)
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch { /* ignore */ }
}

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// ── Shared JSON format (production / file) ────────────────────────────────
const jsonFormat = combine(
  timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  errors({ stack: true }),
  json()
);

// ── Pretty console format (development) ──────────────────────────────────
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ timestamp: ts, level, message, service, ...meta }) => {
    const extra = Object.keys(meta).filter((k) => k !== "service").length
      ? ` ${JSON.stringify(meta)}`
      : "";
    return `${ts} [${level}]: ${message}${extra}`;
  })
);

// ── Transports ─────────────────────────────────────────────────────────────
const transports = [];

if (process.env.NODE_ENV === "production") {
  // Production: JSON to stdout so Docker log driver / Loki can consume it
  transports.push(new winston.transports.Console({ format: jsonFormat }));

  // Optional file transports in production (useful outside Docker)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: jsonFormat,
      maxsize: 20 * 1024 * 1024, // 20 MB
      maxFiles: 5,
    })
  );
} else {
  // Development: pretty console only
  transports.push(new winston.transports.Console({ format: consoleFormat }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  // Add `http` level support (Morgan uses it)
  levels: { ...winston.config.npm.levels, http: 5 },
  format: jsonFormat, // default format for file transports
  defaultMeta: {
    service: "olp-api",
    environment: process.env.NODE_ENV || "development",
  },
  transports,
  // Don't exit on unhandled promise rejections
  exitOnError: false,
});

// Add colours for http level in dev
winston.addColors({ http: "magenta" });

module.exports = logger;
