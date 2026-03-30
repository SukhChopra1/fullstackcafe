const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fullstackCafe";
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Connection Failed:", error.message);
    console.warn("⚠️ MongoDB is unavailable. The server is running in degraded mode.");
    return false;
  }
};

module.exports = connectDB;