import express from "express";
import multer from "multer";
import { handleUpload } from "../controllers/uploadController";
import path from "path";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads");
import fs from "fs";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { cb(null, Date.now() + "_" + file.originalname); }
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), handleUpload);

export default router;
