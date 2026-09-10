import dotenv from "dotenv";
import dns from "node:dns";
import mongoose from "mongoose";

dotenv.config();

dns.setServers(["1.1.1.1", "1.0.0.1"]);

async function connectDatabase() {
  if (!process.env.DB_URL) {
    console.error(
      "DB_URL is not set. Please configure your environment (see backend/env.example)"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

export { connectDatabase };