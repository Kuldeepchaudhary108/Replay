const runs = new Map();

export function createRunRecord(runId, initialState = {}) {
  const record = {
    runId,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    completedAt: null,
    events: [],
    result: null,
    error: null,
    ...initialState,
  };

  runs.set(runId, record);
  return record;
}

export function updateRunRecord(runId, patch = {}) {
  const existing = runs.get(runId) || createRunRecord(runId);
  const updated = {
    ...existing,
    ...patch,
    runId,
  };

  runs.set(runId, updated);
  return updated;
}

export function appendRunEvent(runId, event) {
  const existing = runs.get(runId) || createRunRecord(runId);
  existing.events = [...existing.events, event];
  existing.updatedAt = event.timestamp;
  runs.set(runId, existing);
  return existing;
}

export function completeRunRecord(runId, result) {
  const completedAt = new Date().toISOString();
  const existing = runs.get(runId) || createRunRecord(runId);
  const updated = {
    ...existing,
    status: result?.status || "COMPLETED",
    completedAt,
    result,
  };

  runs.set(runId, updated);
  return updated;
}

export function failRunRecord(runId, error) {
  const completedAt = new Date().toISOString();
  const existing = runs.get(runId) || createRunRecord(runId);
  const updated = {
    ...existing,
    status: "FAILED",
    completedAt,
    error: error?.message || String(error),
  };

  runs.set(runId, updated);
  return updated;
}

export function getRunRecord(runId) {
  return runs.get(runId) || null;
}

export function listRunRecords() {
  return [...runs.values()];
}
