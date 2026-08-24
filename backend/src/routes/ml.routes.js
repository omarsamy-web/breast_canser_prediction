import { Router } from "express";
import { analyze, evaluate, history, models, predict, train } from "../controllers/ml.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { enforcePredictionAccess } from "../controllers/payment.controller.js";

const router = Router();

router.use(authenticate);
router.post("/train", authorize("Admin"), train);
router.post("/predict", enforcePredictionAccess(), predict);
router.get("/analyze", authorize("Admin"), analyze);
router.get("/evaluate", evaluate);
router.get("/models", models);
router.get("/history", history);

export default router;
