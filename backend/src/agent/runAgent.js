import fs from "fs-extra";
import path from "node:path";
import { randomUUID } from "crypto";
import { buildAgentGraph } from "./langGraphRunner.js";
import { cleanup } from "../services/cleanup.service.js";
import {
  completeRunRecord,
  createRunRecord,
  patchRunRecord,
  failRunRecord,
} from "../services/runRegistry.js";
import {
  emitRunEvent,
  runWithExecutionContext,
} from "../utils/executionContext.js";

export async function runAgent(input, context = {}) {
  const graph = buildAgentGraph();
  const runId = input.runId || randomUUID();
  const startedAt = Date.now();
  const workspacePath = path.resolve("sandbox", "jobs", runId);
  const repoPath = path.join(workspacePath, "repo");
  const resultsPath = path.join(workspacePath, "results.json");

  await fs.remove(workspacePath);
  await fs.ensureDir(workspacePath);

  createRunRecord(runId, {
    input,
    status: "RUNNING",
    workspacePath,
    repoPath,
    resultsPath,
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
      { io: context.io, runId, workspacePath, repoPath, resultsPath },
      () =>
        graph.invoke({
          ...input,
          runId,
          repoPath,
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

    await fs.writeJson(resultsPath, results, { spaces: 2 });

    patchRunRecord({
      runId,
      workspacePath,
      repoPath,
      resultsPath,
      status: results.status,
      completedAt: results.completedAt,
    });
    completeRunRecord(runId, results);
    emitRunEvent({
      runId,
      type: "COMPLETE",
      status: results.status,
      message: "Execution finished",
      report: results,
    });

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
    try {
      await cleanup(workspacePath);
      console.log(`[CLEANUP] Workspace ${workspacePath} removed`);
    } catch (cleanupError) {
      console.error(`[CLEANUP] Failed to remove ${workspacePath}:`, cleanupError.message);
    }
  }
}
