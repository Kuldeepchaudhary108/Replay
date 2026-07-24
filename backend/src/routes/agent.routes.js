import express from "express";
import { runAgent } from "../agent/runAgent.js";
import { getRunRecord, listRunRecords } from "../services/runRegistry.js";

const router = express.Router();

router.post("/run-agent", async (req, res) => {
  const io = req.app.get("io");
  const result = await runAgent(req.body, { io });
  res.json(result);
});

router.get("/runs/:runId", (req, res) => {
  const run = getRunRecord(req.params.runId);

  if (!run) {
    return res.status(404).json({ message: "Run not found" });
  }

  return res.json(run);
});

router.get("/runs", (_req, res) => {
  res.json(listRunRecords());
});

export default router;
