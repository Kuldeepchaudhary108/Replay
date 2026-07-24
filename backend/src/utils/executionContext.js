import { AsyncLocalStorage } from "node:async_hooks";
import { appendRunEvent, updateRunRecord } from "../services/runRegistry.js";

const executionContext = new AsyncLocalStorage();

export function runWithExecutionContext(context, callback) {
  return executionContext.run(context, callback);
}

export function getExecutionContext() {
  return executionContext.getStore() || {};
}

export function emitRunEvent(event) {
  const context = getExecutionContext();
  const runId = event.runId || context.runId;
  const timestamp = event.timestamp || new Date().toISOString();
  const payload = { ...event, runId, timestamp };

  if (runId) {
    appendRunEvent(runId, payload);
  }

  if (context.io && runId) {
    context.io.to(runId).emit("agent:event", payload);
  }

  return payload;
}

export function patchRunRecord(patch) {
  const context = getExecutionContext();
  const runId = patch.runId || context.runId;

  if (runId) {
    updateRunRecord(runId, patch);
  }

  return runId;
}
