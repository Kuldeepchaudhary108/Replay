import fs from "fs";
import { buildAgentGraph } from "./langGraphRunner.js";
import { cleanup } from "../services/cleanup.service.js";

export async function runAgent(input) {
  const graph = buildAgentGraph();

  try {
    const finalState = await graph.invoke({
      ...input,
      repoPath: "sandbox/repo",
      iteration: 1,
      timeline: [],
      startTime: Date.now(),
    });
    const endTime = Date.now();
    const durationMs = endTime - finalState.startTime;
    const durationSeconds = Math.floor(durationMs / 1000);

    // 🔥 Score Calculation
    let baseScore = 100;
    let speedBonus = durationMs < 5 * 60 * 1000 ? 10 : 0;
    let commitCount = finalState.iteration - 1;
    let efficiencyPenalty = commitCount > 20 ? (commitCount - 20) * 2 : 0;

    let finalScore = baseScore + speedBonus - efficiencyPenalty;

    const results = {
      repoUrl: finalState.repoUrl,
      branch: finalState.branch,

      retryUsed: `${finalState.iteration - 1}/5`,

      timeline: finalState.timeline,

      score: {
        base: baseScore,
        speedBonus,
        efficiencyPenalty,
        final: finalScore,
      },

      totalTimeSeconds: durationSeconds,

      status: finalState.execution?.success ? "PASSED" : "FAILED",
    };

    fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
    return results;
  } finally {
    await cleanup("sandbox/repo");
    console.log("[CLEANUP] Sandbox removed");
  }
}
