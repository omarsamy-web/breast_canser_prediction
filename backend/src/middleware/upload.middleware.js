import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
});

export const uploadCsv = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.includes("csv") || path.extname(file.originalname).toLowerCase() === ".csv";
    cb(ok ? null : new Error("Only CSV files are allowed"), ok);
  },
  limits: { fileSize: 1024 * 1024 * 1024 }
});
