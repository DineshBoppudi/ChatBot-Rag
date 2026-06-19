import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoute from "./routes/upload";
import datasetRoutes from "./routes/dataset.routes";
import chatRoute from "./routes/chat";
import { initDb } from "./db";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', uploadRoute);
app.use('/api/datasets', datasetRoutes);
app.use('/api/chat', chatRoute);

app.use(errorHandler as any);

const port = process.env.PORT || 4000;
initDb().then(() => {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}).catch(err => { console.error(err); process.exit(1); });
