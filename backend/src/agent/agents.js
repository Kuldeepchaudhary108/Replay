import {
  cloneRepo,
  createBranch,
  commitChanges,
} from "../services/git.service.js";

import { detectPipeline } from "../services/pipelineDetector.service.js";
import { extractPipelineCommands } from "../services/pipelineParser.service.js";
import { executePipeline } from "../services/pipelineExecutor.service.js";
import { analyzeFailure } from "../services/failureAnalyzer.service.js";
import { applyFix } from "../services/fixer.service.js";
import { generateBranchName } from "../utils/branchName.js";

/**
 * Repo Agent
 */
export const repoAgent = async (state) => {
  state.branch = generateBranchName(state.teamName, state.leaderName);

  await cloneRepo(state.repoUrl, state.repoPath, state.githubToken);

  await createBranch(state.repoPath, state.branch);

  return state;
};

/**
 * Pipeline Agent
 */
export const pipelineAgent = async (state) => {
  const type = detectPipeline(state.repoPath);

  if (type === "NONE") {
    throw new Error("No CI/CD pipeline found");
  }

  state.commands = extractPipelineCommands(state.repoPath);

  return state;
};

/**
 * Executor Agent
 */
export const executorAgent = async (state) => {
  state.execution = executePipeline(state.commands, state.repoPath);

  return state;
};

/**
 * Analyzer Agent
 */
export const analyzerAgent = async (state) => {
  if (state.execution.success) return state;

  state.bugType = analyzeFailure(
    state.execution.error,
    state.execution.failedCommand,
  );

  return state;
};

/**
 * Fix Agent
 */
export const fixerAgent = async (state) => {
  if (!state.timeline) state.timeline = [];

  const now = new Date().toISOString();

  /**
   * PASSED
   */
  if (state.execution.success) {
    state.timeline.push({
      iteration: state.iteration,
      status: "PASSED",
      failedStep: null,
      errorType: null,
      errorMessage: null,
      agentAction: "Pipeline executed successfully",
      filesModified: [],
      timestamp: now,
    });

    return state;
  }

  /**
   * FAILED
   */
  const fix = applyFix(state.bugType.type, state.repoPath);

  if (!fix) return state;

  state.fixMessage = fix.message;

  state.timeline.push({
    iteration: state.iteration,

    status: "FAILED",

    failedStep: state.execution.failedCommand,

    errorType: state.bugType.type,

    errorMessage: state.bugType.reason,

    agentAction: fix.action,

    filesModified: fix.filesModified,

    timestamp: now,
  });

  return state;
};

/**
 * Git Agent
 */
export const gitAgent = async (state) => {
  if (!state.fixMessage) return state;

  await commitChanges(state.repoPath, state.fixMessage, state.branch);

  state.iteration++;

  return state;
};
