import fs from "fs";
import { emitRunEvent } from "../utils/executionContext.js";

export function detectPipeline(repoPath) {
  emitRunEvent({
    type: "STATUS",
    agent: "pipeline",
    status: "RUNNING",
    message: "Detecting pipeline configuration",
  });

  if (fs.existsSync(`${repoPath}/.github/workflows`)) {
    emitRunEvent({
      type: "STATUS",
      agent: "pipeline",
      status: "SUCCESS",
      message: "GitHub Actions workflow detected",
    });
    return "GITHUB_ACTIONS";
  }

  emitRunEvent({
    type: "ERROR",
    agent: "pipeline",
    status: "FAILED",
    message: "No CI/CD pipeline found",
  });
  return "NONE";
}
