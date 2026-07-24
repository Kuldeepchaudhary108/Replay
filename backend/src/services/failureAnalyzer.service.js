import { emitRunEvent } from "../utils/executionContext.js";

export function analyzeFailure(error = "", failedCommand = "") {

  emitRunEvent({
    type: "STATUS",
    agent: "analyzer",
    status: "RUNNING",
    message: "Analyzing failure details",
    command: failedCommand,
  });

  if (
    error.includes('Missing script: "test"') ||
    error.includes("missing script: test") ||
    failedCommand === "npm test"
  ) {
    const result = {
      type: "CI_CONFIG",
      reason: "Missing npm test script"
    };

    emitRunEvent({
      type: "STATUS",
      agent: "analyzer",
      status: "SUCCESS",
      message: result.reason,
      bugType: result.type,
    });

    return result;
  }

  if (error.includes("eslint")) {
    const result = {
      type: "LINTING",
      reason: "ESLint errors detected"
    };

    emitRunEvent({
      type: "STATUS",
      agent: "analyzer",
      status: "SUCCESS",
      message: result.reason,
      bugType: result.type,
    });

    return result;
  }

  if (error.includes("SyntaxError")) {
    const result = {
      type: "SYNTAX",
      reason: "Syntax error"
    };

    emitRunEvent({
      type: "STATUS",
      agent: "analyzer",
      status: "SUCCESS",
      message: result.reason,
      bugType: result.type,
    });

    return result;
  }

  if (error.includes("TypeError")) {
    const result = {
      type: "TYPE_ERROR",
      reason: "Runtime type error"
    };

    emitRunEvent({
      type: "STATUS",
      agent: "analyzer",
      status: "SUCCESS",
      message: result.reason,
      bugType: result.type,
    });

    return result;
  }

  if (error.includes("Module not found")) {
    const result = {
      type: "IMPORT",
      reason: "Missing module"
    };

    emitRunEvent({
      type: "STATUS",
      agent: "analyzer",
      status: "SUCCESS",
      message: result.reason,
      bugType: result.type,
    });

    return result;
  }

  const result = {
    type: "UNKNOWN",
    reason: "Unknown pipeline failure"
  };

  emitRunEvent({
    type: "STATUS",
    agent: "analyzer",
    status: "SUCCESS",
    message: result.reason,
    bugType: result.type,
  });

  return result;
}