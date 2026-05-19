require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const logger = require("./config/logger");
const seedDatabase = require("./utils/seed");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();
    logger.info("MongoDB Connected");

    // Connect Redis
    await connectRedis();
    logger.info("Redis Connected");

    // Seed demo data if enabled
    if (process.env.SEED_ON_START === "true") {
      await seedDatabase();
      logger.info("Database Seeded");
    }

    // Health check route
    app.get("/", (_req, res) => {
      res.send("Backend is running successfully");
    });

    // Start Express server
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (err) {
    logger.error("Failed to start server", {
      error: err.message,
    });

    process.exit(1);
  }
};

startServer();