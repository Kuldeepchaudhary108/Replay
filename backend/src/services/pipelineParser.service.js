import fs from "fs";
import yaml from "js-yaml";
import { emitRunEvent } from "../utils/executionContext.js";

export function extractPipelineCommands(repoPath) {
  const workflowDir = `${repoPath}/.github/workflows`;
  const files = fs.readdirSync(workflowDir);

  emitRunEvent({
    type: "STATUS",
    agent: "pipeline",
    status: "RUNNING",
    message: "Parsing workflow YAML",
  });

  const commands = [];

  for (const file of files) {
    const content = yaml.load(
      fs.readFileSync(`${workflowDir}/${file}`, "utf-8")
    );

    const jobs = content.jobs || {};
    for (const job of Object.values(jobs)) {
      const steps = job.steps || [];
      for (const step of steps) {
        if (step.run) {
          commands.push(step.run);
        }
      }
    }
  }

  emitRunEvent({
    type: "STATUS",
    agent: "pipeline",
    status: "SUCCESS",
    message: "Workflow commands extracted",
    commands,
  });

  return commands;
}
