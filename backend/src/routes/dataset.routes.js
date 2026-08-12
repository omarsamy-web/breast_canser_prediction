import { Router } from "express";
import { deleteDataset, listDatasets, uploadDataset } from "../controllers/dataset.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { uploadCsv } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/upload", uploadCsv.single("file"), uploadDataset);
router.get("/", listDatasets);
router.delete("/:id", authorize("Admin", "Researcher"), deleteDataset);

export default router;
