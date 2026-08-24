import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, register } from "../controllers/auth.controller.js";
import { auditEvent } from "../config/monitoring.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again in 15 minutes." }
});

function auditAuth(name) {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode < 300 || res.statusCode === 401 || res.statusCode === 409) {
        auditEvent(`auth.${name}`, {
          email: req.body?.email,
          status: res.statusCode,
          ip: req.ip
        });
      }
    });
    next();
  };
}

const router = Router();

router.post("/register", authLimiter, auditAuth("register"), register);
router.post("/login", authLimiter, auditAuth("login"), login);

export default router;
