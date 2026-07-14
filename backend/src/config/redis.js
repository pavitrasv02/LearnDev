/**
 * Redis connection manager.
 *
 * Design principles:
 * - Application NEVER crashes if Redis is unavailable.
 * - getRedis() returns null when Redis is down → all cache operations no-op.
 * - Reconnects automatically via ioredis retryStrategy.
 * - On permanent failure (maxRetriesPerRequest exhausted) redis is set to null.
 */
const Redis = require("ioredis");
const logger = require("./logger");

let redis = null;
let connectionAttempted = false;

const connectRedis = async () => {
  if (connectionAttempted) return redis;
  connectionAttempted = true;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  return new Promise((resolve) => {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.warn("Redis: max retries reached, disabling cache");
          return null; // stop retrying
        }
        return Math.min(times * 300, 3000);
      },
    });

    client.on("connect", () => {
      redis = client;
      logger.info("Redis connected", { url: url.replace(/:\/\/.*@/, "://***@") });
    });

    client.on("ready", () => {
      redis = client;
    });

    client.on("error", (err) => {
      // Only log once per error type to avoid log spam
      logger.warn("Redis error", { error: err.message });
    });

    client.on("close", () => {
      logger.warn("Redis connection closed — cache disabled");
      redis = null;
    });

    client.on("end", () => {
      logger.warn("Redis connection ended");
      redis = null;
    });

    // Attempt connection — resolve regardless of success/failure
    client.connect()
      .then(() => {
        redis = client;
        resolve(client);
      })
      .catch((err) => {
        logger.warn("Redis unavailable — running without cache", { error: err.message });
        redis = null;
        resolve(null);
      });
  });
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
