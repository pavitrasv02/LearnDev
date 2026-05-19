const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/olp";
  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected", { uri: uri.replace(/\/\/.*@/, "//***@") });
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    process.exit(1);
  }
};

module.exports = connectDB;
