import express from "express";
import { runAgent } from "../agent/runAgent.js";

const router = express.Router();

router.post("/run-agent", async (req, res) => {
  const result = await runAgent(req.body);
  res.json(result);
});

export default router;
