import { Router } from "express";
import { searchEmbeddings } from "../services/searchEmbeddings";

const router = Router();

router.get("/", async (req, res) => {
  const results =
    await searchEmbeddings(
      "cardio_equipment",
      "Which products are most expensive?"
    );

  res.json(results);
});

export default router;