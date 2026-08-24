import jwt from "jsonwebtoken";
import { hasDatabase } from "../config/database.js";
import User from "../models/User.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = hasDatabase()
      ? await User.findById(payload.id).select("-password")
      : hasSupabase()
        ? await supabaseStore.users.findById(payload.id)
        : memory.users.findById(payload.id);
    if (!user) return res.status(401).json({ message: "Invalid token" });

    // Legacy accounts predate the Admin/Patient split — treat them as Admin.
    if (user.role === "Doctor" || user.role === "Researcher") {
      user.role = "Admin";
      if (hasDatabase()) {
        await User.findByIdAndUpdate(user._id, { role: "Admin" }).catch(() => {});
      } else if (hasSupabase()) {
        await supabaseStore.users.update(user._id, { role: "Admin" }).catch(() => {});
      }
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
