import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const customEnv =
      globalThis.processEnv && typeof globalThis.processEnv === "object"
        ? globalThis.processEnv
        : null;
    const mongoUri =
      customEnv?.MONGO_URI ||
      customEnv?.MONGO_URL ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL;

    if (!mongoUri || typeof mongoUri !== "string") {
      throw new Error("Missing MongoDB URI. Set MONGO_URI or MONGO_URL.");
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;