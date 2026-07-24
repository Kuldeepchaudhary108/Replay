import { execSync } from "child_process";
import { emitRunEvent } from "../utils/executionContext.js";

/**
 * Steps that MUST NOT run locally
 */
function isCIContextStep(command) {
  return (
    command.includes("GITHUB_") ||
    command.includes("$GITHUB_ENV") ||
    command.includes("actions/") ||
    command.includes("docker push") ||
    command.includes("gcloud ")
  );
}

/**
 * Steps that are REAL TEST STEPS (container based)
 */
function isContainerTestStep(command) {
  return command.includes("docker run") && command.includes("test.sh");
}

/**
 * Replace GitHub syntax so docker build/run works locally
 */
function sanitizeGitHubSyntax(command) {
  return command
    .replace(/\${{\s*secrets\.[^}]+}}/g, "localuser")
    .replace(/\${{\s*env\.[^}]+}}/g, "latest")
    .replace(/\${{\s*github\.[^}]+}}/g, "1");
}
function cleanupTestContainer() {
  try {
    execSync("docker stop test_container", { stdio: "ignore", shell: true });
  } catch {}

  try {
    execSync("docker rm test_container", { stdio: "ignore", shell: true });
  } catch {}
}

export function executePipeline(commands, repoPath) {
  const skipped = [];

  for (let command of commands) {
    // 🔴 Skip CI-only / deployment steps
    if (isCIContextStep(command)) {
      emitRunEvent({
        type: "STATUS",
        agent: "executor",
        status: "RUNNING",
        message: `Skipping CI-context step: ${command}`,
        command,
      });
      console.log("[PIPELINE] Skipping CI-context step");
      skipped.push(command);
      continue;
    }

    command = sanitizeGitHubSyntax(command);

    if (isContainerTestStep(command)) {
      emitRunEvent({
        type: "STATUS",
        agent: "executor",
        status: "RUNNING",
        message: `Preparing container test environment for ${command}`,
        command,
      });
      console.log("[PIPELINE] Preparing container test environment");

      // 🔥 CLEAN PREVIOUS CONTAINER
      cleanupTestContainer();

      console.log("[PIPELINE] Running container-based tests");
      emitRunEvent({
        type: "STATUS",
        agent: "executor",
        status: "RUNNING",
        message: `Running ${command}`,
        command,
      });

      try {
        execSync(command, {
          cwd: repoPath,
          stdio: "inherit",
          shell: true,
        });
      } catch (err) {
        // clean even on failure
        cleanupTestContainer();

        emitRunEvent({
          type: "ERROR",
          agent: "executor",
          status: "FAILED",
          message: err.message,
          command,
          error: err.message,
        });

        return {
          success: false,
          error: err.message,
          failedCommand: command,
          skipped,
        };
      }

      // clean on success as well
      cleanupTestContainer();
      continue;
    }

    // 🟡 Normal executable steps (docker build, npm test, etc.)
    try {
      emitRunEvent({
        type: "STATUS",
        agent: "executor",
        status: "RUNNING",
        message: `Running ${command}`,
        command,
      });
      console.log("[PIPELINE] Running:", command);

      execSync(command, {
        cwd: repoPath,
        stdio: "inherit",
        shell: true,
      });
    } catch (err) {
      emitRunEvent({
        type: "ERROR",
        agent: "executor",
        status: "FAILED",
        message: err.message,
        command,
        error: err.message,
      });

      return {
        success: false,
        error: err.message,
        failedCommand: command,
        skipped,
      };
    }
  }

  emitRunEvent({
    type: "STATUS",
    agent: "executor",
    status: "SUCCESS",
    message: "Pipeline commands completed successfully",
  });

  return {
    success: true,
    skipped,
  };
}
