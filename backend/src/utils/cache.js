const { getRedis } = require("../config/redis");
const logger = require("../config/logger");

const DEFAULT_TTL = 300; // 5 minutes

// Lazy-load metrics to avoid circular dep at startup
let _metrics = null;
const getMetrics = () => {
  if (!_metrics) {
    try { _metrics = require("../config/metrics"); } catch { /* metrics not available */ }
  }
  return _metrics;
};

async function getCache(key) {
  const redis = getRedis();
  if (!redis) {
    getMetrics()?.cacheMisses.inc();
    return null;
  }
  try {
    const data = await redis.get(key);
    if (data) {
      getMetrics()?.cacheHits.inc();
      return JSON.parse(data);
    }
    getMetrics()?.cacheMisses.inc();
    return null;
  } catch (err) {
    logger.warn("Cache get failed", { key, error: err.message });
    getMetrics()?.cacheMisses.inc();
    return null;
  }
}

async function setCache(key, value, ttl = DEFAULT_TTL) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn("Cache set failed", { key, error: err.message });
  }
}

async function deleteCache(pattern) {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.warn("Cache delete failed", { pattern, error: err.message });
  }
}

async function withLock(lockKey, fn, ttl = 10) {
  const redis = getRedis();
  if (!redis) return fn(); // graceful degradation: run without lock
  const lockValue = Date.now().toString();
  const acquired = await redis.set(lockKey, lockValue, "EX", ttl, "NX");
  if (!acquired) throw new Error("Resource is locked, try again");
  try {
    return await fn();
  } finally {
    const current = await redis.get(lockKey);
    if (current === lockValue) await redis.del(lockKey);
  }
}

module.exports = { getCache, setCache, deleteCache, withLock, DEFAULT_TTL };
