import { Router } from "express";
import { changePlan, getBilling, listPlans } from "../controllers/billing.controller.js";
import { checkout, creditStatus } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/plans", listPlans);
router.get("/credits", authenticate, creditStatus);
router.post("/checkout", authenticate, checkout);
router.get("/billing", authenticate, getBilling);
router.post("/billing/plan", authenticate, changePlan);

export default router;
