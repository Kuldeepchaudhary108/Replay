export function analyzeFailure(error = "", failedCommand = "") {

  if (
    error.includes('Missing script: "test"') ||
    error.includes("missing script: test") ||
    failedCommand === "npm test"
  ) {
    return {
      type: "CI_CONFIG",
      reason: "Missing npm test script"
    };
  }

  if (error.includes("eslint")) {
    return {
      type: "LINTING",
      reason: "ESLint errors detected"
    };
  }

  if (error.includes("SyntaxError")) {
    return {
      type: "SYNTAX",
      reason: "Syntax error"
    };
  }

  if (error.includes("TypeError")) {
    return {
      type: "TYPE_ERROR",
      reason: "Runtime type error"
    };
  }

  if (error.includes("Module not found")) {
    return {
      type: "IMPORT",
      reason: "Missing module"
    };
  }

  return {
    type: "UNKNOWN",
    reason: "Unknown pipeline failure"
  };
}