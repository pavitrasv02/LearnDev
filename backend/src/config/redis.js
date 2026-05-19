const Redis = require("ioredis");
const logger = require("./logger");

let redis = null;

const connectRedis = () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 200, 3000),
    lazyConnect: true,
  });

  redis.on("connect", () => logger.info("Redis connected"));
  redis.on("error", (err) => logger.warn("Redis error", { error: err.message }));

  redis.connect().catch(() => {
    logger.warn("Redis unavailable — running without cache");
    redis = null;
  });

  return redis;
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
