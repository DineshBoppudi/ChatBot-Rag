import express from "express";
import cors from "cors";
import { pool } from "./db/database";
import uploadRoutes from "./routes/upload.routes";
import datasetRoutes from "./routes/dataset.routes";
import chatRoutes from "./routes/chat.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import documentRoutes from "./routes/document.routes";
import embeddingRoutes from "./routes/embedding.routes";
import geminiModelsRoute from "./routes/geminiModels.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    
    res.json({
      success: true,
      databaseTime: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.use("/api/upload", uploadRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/embeddings", embeddingRoutes);
app.use(
  "/api/gemini-models",
  geminiModelsRoute
);

app.get("/test-dashboard", (req, res) => {
  res.json({
    message: "NEW SERVER VERSION",
    commit: "a038558",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});