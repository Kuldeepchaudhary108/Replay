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
import { emitRunEvent } from "../utils/executionContext.js";

/**
 * Repo Agent
 */
export const repoAgent = async (state) => {
  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "repo",
    status: "RUNNING",
    message: "Cloning repository...",
  });

  state.branch = generateBranchName(state.teamName, state.leaderName);

  await cloneRepo(state.repoUrl, state.repoPath, state.githubToken);

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "repo",
    status: "SUCCESS",
    message: "Repository cloned",
  });

  await createBranch(state.repoPath, state.branch);

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "repo",
    status: "SUCCESS",
    message: `Created working branch ${state.branch}`,
    branch: state.branch,
  });

  return state;
};

/**
 * Pipeline Agent
 */
export const pipelineAgent = async (state) => {
  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "pipeline",
    status: "RUNNING",
    message: "Detecting workflow...",
  });

  const type = detectPipeline(state.repoPath);

  if (type === "NONE") {
    emitRunEvent({
      runId: state.runId,
      type: "ERROR",
      agent: "pipeline",
      status: "FAILED",
      message: "No CI/CD pipeline found",
    });
    throw new Error("No CI/CD pipeline found");
  }

  state.commands = extractPipelineCommands(state.repoPath);

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "pipeline",
    status: "SUCCESS",
    message: "Workflow parsed",
    commands: state.commands,
  });

  return state;
};

/**
 * Executor Agent
 */
export const executorAgent = async (state) => {
  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "executor",
    status: "RUNNING",
    message: "Running pipeline commands",
  });

  state.execution = executePipeline(state.commands, state.repoPath);

  emitRunEvent({
    runId: state.runId,
    type: state.execution.success ? "STATUS" : "ERROR",
    agent: "executor",
    status: state.execution.success ? "SUCCESS" : "FAILED",
    message: state.execution.success
      ? "Pipeline execution completed"
      : state.execution.error,
    command: state.execution.failedCommand || null,
    error: state.execution.success ? null : state.execution.error,
  });

  return state;
};

/**
 * Analyzer Agent
 */
export const analyzerAgent = async (state) => {
  if (state.execution.success) return state;

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "analyzer",
    status: "RUNNING",
    message: "Analyzing failure",
    command: state.execution.failedCommand,
  });

  state.bugType = analyzeFailure(
    state.execution.error,
    state.execution.failedCommand,
  );

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "analyzer",
    status: "SUCCESS",
    message: state.bugType.reason,
    bugType: state.bugType.type,
  });

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

    emitRunEvent({
      runId: state.runId,
      type: "STATUS",
      agent: "fixer",
      status: "SUCCESS",
      message: "Pipeline passed without requiring fixes",
    });

    return state;
  }

  /**
   * FAILED
   */
  const fix = applyFix(state.bugType.type, state.repoPath);

  if (!fix) return state;

  state.fixMessage = fix.message;

  emitRunEvent({
    runId: state.runId,
    type: "FIX",
    agent: "fixer",
    status: "SUCCESS",
    message: fix.action,
    filesModified: fix.filesModified,
  });

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

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "git",
    status: "RUNNING",
    message: "Committing and pushing fixes",
    branch: state.branch,
  });

  await commitChanges(state.repoPath, state.fixMessage, state.branch);

  emitRunEvent({
    runId: state.runId,
    type: "STATUS",
    agent: "git",
    status: "SUCCESS",
    message: "Commit pushed",
    branch: state.branch,
  });

  state.iteration++;

  return state;
};
