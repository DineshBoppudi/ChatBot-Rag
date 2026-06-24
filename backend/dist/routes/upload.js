"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("../controllers/uploadController");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const uploadDir = path_1.default.join(process.cwd(), "uploads");
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir);
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) { cb(null, Date.now() + "_" + file.originalname); }
});
const upload = (0, multer_1.default)({ storage });
router.post("/upload", upload.single("file"), uploadController_1.handleUpload);
exports.default = router;
