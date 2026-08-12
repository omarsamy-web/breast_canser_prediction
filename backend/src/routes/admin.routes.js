import { Router } from "express";
import { overview, users } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, authorize("Admin"));
router.get("/overview", overview);
router.get("/users", users);

export default router;
