import mongoose from "mongoose";
import { hasSupabase } from "../services/supabase.store.js";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set. API will start without database persistence.");
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (hasSupabase()) {
      console.warn("Supabase is configured. API will use Supabase persistence.");
    } else {
      console.warn("Using in-memory development store. Data resets when the API restarts.");
    }
  }
}

export function hasDatabase() {
  return mongoose.connection.readyState === 1;
}
