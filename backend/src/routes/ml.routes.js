import { Router } from "express";
import { evaluate, history, models, predict, train } from "../controllers/ml.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/train", train);
router.post("/predict", predict);
router.get("/evaluate", evaluate);
router.get("/models", models);
router.get("/history", history);

export default router;
