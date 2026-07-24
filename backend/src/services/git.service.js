import simpleGit from "simple-git";
import fs from "fs-extra";
import { emitRunEvent } from "../utils/executionContext.js";

/**
 * Clone repository using user-provided GitHub token
 */
export async function cloneRepo(repoUrl, repoPath, githubToken) {
  emitRunEvent({
    type: "STATUS",
    agent: "repo",
    status: "RUNNING",
    message: "Cloning repository into workspace",
  });

  await fs.remove(repoPath);


  if (!githubToken) {
    throw new Error("GitHub token is required to push fixes");
  }

  const authRepoUrl = repoUrl.replace("https://", `https://${githubToken}@`);

  await simpleGit().clone(authRepoUrl, repoPath);

  emitRunEvent({
    type: "STATUS",
    agent: "repo",
    status: "SUCCESS",
    message: "Repository cloned successfully",
  });
}

/**
 * Create and checkout required branch
 */
export async function createBranch(repoPath, branch) {
  const git = simpleGit(repoPath);
  emitRunEvent({
    type: "STATUS",
    agent: "repo",
    status: "RUNNING",
    message: `Creating branch ${branch}`,
    branch,
  });
  await git.checkoutLocalBranch(branch);

  emitRunEvent({
    type: "STATUS",
    agent: "repo",
    status: "SUCCESS",
    message: `Branch ${branch} ready`,
    branch,
  });
}

/**
 * Commit and push changes to remote branch
 */
export async function commitChanges(repoPath, message, branch) {
  const git = simpleGit(repoPath);

  emitRunEvent({
    type: "STATUS",
    agent: "git",
    status: "RUNNING",
    message: "Creating commit",
    branch,
  });

  await git.add(".");
  await git.commit(`[AI-AGENT] ${message}`);

  // First push: set upstream
  const remotes = await git.getRemotes(true);
// console.log(remotes);
// console.log(await git.branchLocal());
  await git.push(["--set-upstream", "origin", branch]);

  emitRunEvent({
    type: "STATUS",
    agent: "git",
    status: "SUCCESS",
    message: "Commit pushed to origin",
    branch,
  });
}
