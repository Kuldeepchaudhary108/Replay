import fs from "fs";
import { randomUUID } from "crypto";
import { buildAgentGraph } from "./langGraphRunner.js";
import { cleanup } from "../services/cleanup.service.js";
import {
  completeRunRecord,
  createRunRecord,
} from "../services/runRegistry.js";
import {
  emitRunEvent,
  patchRunRecord,
  runWithExecutionContext,
} from "../utils/executionContext.js";

export async function runAgent(input, context = {}) {
  const graph = buildAgentGraph();
  const runId = input.runId || randomUUID();
  const startedAt = Date.now();

  createRunRecord(runId, {
    input,
    status: "RUNNING",
  });

  emitRunEvent({
    runId,
    type: "STATUS",
    agent: "system",
    status: "RUNNING",
    message: "Agent execution started",
  });

  try {
    const finalState = await runWithExecutionContext(
      { io: context.io, runId },
      () =>
        graph.invoke({
          ...input,
          runId,
          repoPath: "sandbox/repo",
          iteration: 1,
          timeline: [],
          startTime: startedAt,
        }),
    );
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
      runId,
      repoUrl: finalState.repoUrl,
      branch: finalState.branch,
      status: finalState.execution?.success ? "PASSED" : "FAILED",
      startedAt: new Date(finalState.startTime).toISOString(),
      completedAt: new Date(endTime).toISOString(),

      retryUsed: `${finalState.iteration - 1}/5`,
      retryCount: Math.max(finalState.iteration - 1, 0),

      timeline: finalState.timeline,
      iterations: finalState.timeline,
      filesModified: finalState.timeline.flatMap(
        (item) => item.filesModified || [],
      ),

      score: {
        base: baseScore,
        speedBonus,
        efficiencyPenalty,
        final: finalScore,
      },

      totalTimeSeconds: durationSeconds,
    };

    // fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
    // patchRunRecord({
    //   runId,
    //   status: results.status,
    //   completedAt: results.completedAt,
    //   result: results,
    // });
    // completeRunRecord(runId, results);
    // emitRunEvent({
    //   runId,
    //   type: "COMPLETE",
    //   status: results.status,
    //   message: "Execution finished",
    //   report: results,
    // });
    return results;
  } catch (error) {
    failRunRecord(runId, error);
    emitRunEvent({
      runId,
      type: "ERROR",
      agent: "system",
      status: "FAILED",
      message: error.message || "Agent execution failed",
      error: error.message || String(error),
    });
    throw error;
  } finally {
    await cleanup("sandbox/repo");
    console.log("[CLEANUP] Sandbox removed");
  }
}
