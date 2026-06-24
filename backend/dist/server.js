"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./db/database");
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const dataset_routes_1 = __importDefault(require("./routes/dataset.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const embedding_routes_1 = __importDefault(require("./routes/embedding.routes"));
const geminiModels_routes_1 = __importDefault(require("./routes/geminiModels.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", async (req, res) => {
    try {
        const result = await database_1.pool.query("SELECT NOW()");
        res.json({
            success: true,
            databaseTime: result.rows[0],
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});
const PORT = process.env.PORT || 10000;
app.use("/api/upload", upload_routes_1.default);
app.use("/api/datasets", dataset_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/documents", document_routes_1.default);
app.use("/api/embeddings", embedding_routes_1.default);
app.use("/api/gemini-models", geminiModels_routes_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
