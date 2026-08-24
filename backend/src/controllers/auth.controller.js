import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hasDatabase } from "../config/database.js";
import User from "../models/User.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";
import { loginSchema, registerSchema, validate } from "../utils/validators.js";

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

export function publicUser(user) {
  const role = user.role === "Doctor" || user.role === "Researcher" ? "Admin" : user.role;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role,
    plan: user.plan || "free",
    credits: user.credits ?? 0
  };
}

export async function register(req, res, next) {
  try {
    const payload = validate(registerSchema, req.body);
    const exists = hasDatabase()
      ? await User.findOne({ email: payload.email })
      : hasSupabase()
        ? await supabaseStore.users.findByEmail(payload.email)
        : memory.users.findByEmail(payload.email);
    if (exists) return res.status(409).json({ message: "Email already registered" });

    // The very first account on a fresh deployment becomes the Admin.
    const userCount = hasDatabase()
      ? await User.countDocuments()
      : hasSupabase()
        ? await supabaseStore.users.count()
        : memory.users.count();
    const role = userCount === 0 ? "Admin" : payload.role || "Patient";

    let user;
    if (hasSupabase()) {
      user = await supabaseStore.users.create({ ...payload, role, email: payload.email.toLowerCase(), credits: 0, freePredictionUsed: false });
    } else {
      const password = await bcrypt.hash(payload.password, 12);
      user = hasDatabase()
        ? await User.create({ ...payload, role, password })
        : memory.users.create({ ...payload, role, email: payload.email.toLowerCase(), password, credits: 0, freePredictionUsed: false });
    }
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    next(error);
 }
}

export async function login(req, res, next) {
  try {
    const payload = validate(loginSchema, req.body);
    const user = hasDatabase()
      ? await User.findOne({ email: payload.email })
      : hasSupabase()
        ? await supabaseStore.users.verifyPassword(payload.email, payload.password)
        : memory.users.findByEmail(payload.email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!hasSupabase() && !(await bcrypt.compare(payload.password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    if (hasSupabase() && error.response?.status === 400) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    next(error);
  }
}
