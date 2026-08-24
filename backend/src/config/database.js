import mongoose from "mongoose";
import { hasSupabase } from "../services/supabase.store.js";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (hasSupabase()) {
      console.log("MongoDB not configured — using Supabase persistence.");
    } else {
      console.warn("MONGODB_URI is not set and Supabase is not fully configured. API will use the in-memory store (data resets on restart).");
    }
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
