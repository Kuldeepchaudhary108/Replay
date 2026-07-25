import { create } from "zustand";

export type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type RunStageId =
  | "repo"
  | "pipeline"
  | "executor"
  | "analyzer"
  | "fixer"
  | "git"
  | "complete";

export type RunStageStatus = "pending" | "running" | "success" | "failed";

export interface RunEvent {
  runId?: string;
  type: "STATUS" | "ERROR" | "FIX" | "COMPLETE";
  agent?: string;
  status?: string;
  message?: string;
  command?: string | null;
  error?: string | null;
  branch?: string;
  bugType?: string;
  filesModified?: string[];
  commands?: string[];
  report?: RunReport | null;
  timestamp?: string;
}

export interface RunLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "ERROR" | "SUCCESS" | "WARNING";
  message: string;
}

export interface RunTimelineItem {
  iteration: number;
  status: "PASSED" | "FAILED";
  failedStep: string | null;
  errorType: string | null;
  errorMessage: string | null;
  agentAction: string;
  filesModified: string[];
  timestamp: string;
}

export interface RunReport {
  runId: string;
  repoUrl: string;
  branch: string;
  status: "PASSED" | "FAILED";
  startedAt: string;
  completedAt: string;
  retryUsed: string;
  retryCount: number;
  timeline: RunTimelineItem[];
  iterations: RunTimelineItem[];
  filesModified: string[];
  score: {
    base: number;
    speedBonus: number;
    efficiencyPenalty: number;
    final: number;
  };
  totalTimeSeconds: number;
}

interface StageState {
  status: RunStageStatus;
  message: string;
}

interface RunStoreState {
  runId: string | null;
  connectionStatus: SocketConnectionStatus;
  events: RunEvent[];
  logs: RunLogEntry[];
  report: RunReport | null;
  error: string | null;
  stageStates: Record<RunStageId, StageState>;
  activeCommand: string | null;
  retryCount: number;
  setRunId: (runId: string) => void;
  setConnectionStatus: (status: SocketConnectionStatus) => void;
  hydrateSnapshot: (snapshot: Partial<RunStoreState> & { report?: RunReport | null }) => void;
  ingestEvent: (event: RunEvent) => void;
  resetRun: () => void;
}

const createStageState = (): Record<RunStageId, StageState> => ({
  repo: { status: "pending", message: "Waiting for repository setup" },
  pipeline: { status: "pending", message: "Waiting for workflow detection" },
  executor: { status: "pending", message: "Waiting for pipeline execution" },
  analyzer: { status: "pending", message: "Waiting for failure analysis" },
  fixer: { status: "pending", message: "Waiting for automatic fixes" },
  git: { status: "pending", message: "Waiting for git commit and push" },
  complete: { status: "pending", message: "Waiting for completion" },
});

const initialState = {
  runId: null,
  connectionStatus: "disconnected" as SocketConnectionStatus,
  events: [],
  logs: [],
  report: null,
  error: null,
  stageStates: createStageState(),
  activeCommand: null,
  retryCount: 0,
};

function mapEventToStage(agent?: string): RunStageId | null {
  switch (agent) {
    case "repo":
      return "repo";
    case "pipeline":
      return "pipeline";
    case "executor":
      return "executor";
    case "analyzer":
      return "analyzer";
    case "fixer":
      return "fixer";
    case "git":
      return "git";
    case "system":
      return "complete";
    default:
      return null;
  }
}

function nextStageStatus(status?: string, type?: RunEvent["type"]): RunStageStatus {
  if (status === "FAILED" || type === "ERROR") return "failed";
  if (status === "RUNNING" || status === "ACTIVE") return "running";
  if (status === "SUCCESS" || status === "PASSED") return "success";
  return "running";
}

function toLogLevel(event: RunEvent): RunLogEntry["level"] {
  if (event.type === "ERROR" || event.status === "FAILED") return "ERROR";
  if (event.type === "FIX") return "SUCCESS";
  return "INFO";
}

export const useRunStore = create<RunStoreState>((set) => ({
  ...initialState,
  setRunId: (runId) => set({ runId }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  hydrateSnapshot: (snapshot) =>
    set((state) => ({
      ...state,
      ...snapshot,
      stageStates:
        snapshot.stageStates || state.stageStates || createStageState(),
      report: snapshot.report ?? state.report,
      events: snapshot.events ?? state.events,
      logs: snapshot.logs ?? state.logs,
    })),
  ingestEvent: (event) =>
    set((state) => {
      const timestamp = event.timestamp || new Date().toISOString();
      const eventKey = `${event.agent || ""}-${event.status || ""}-${event.message || ""}-${timestamp}`;
      const isDuplicate = state.events.some(
        (e) =>
          `${e.agent || ""}-${e.status || ""}-${e.message || ""}-${e.timestamp || ""}` === eventKey,
      );

      if (isDuplicate) return state;

      const events = [...state.events, { ...event, timestamp }];
      const logEntry: RunLogEntry = {
        id: `${timestamp}-${events.length}`,
        timestamp,
        level: toLogLevel(event),
        message:
          event.message || event.command || event.error || "Execution event received",
      };
      const logs = [...state.logs, logEntry].slice(-300);
      const nextStages = { ...state.stageStates };
      const stageId = mapEventToStage(event.agent);

      if (stageId) {
        nextStages[stageId] = {
          status: nextStageStatus(event.status, event.type),
          message: event.message || nextStages[stageId].message,
        };
      }

      if (event.command) {
        nextStages.executor = {
          status: nextStageStatus(event.status, event.type),
          message: `Running ${event.command}`,
        };
      }

      if (event.type === "FIX" && event.filesModified?.length) {
        nextStages.fixer = {
          status: "success",
          message: `Updated ${event.filesModified.join(", ")}`,
        };
      }

      if (event.type === "COMPLETE") {
        nextStages.complete = {
          status: event.status === "FAILED" ? "failed" : "success",
          message: event.message || "Execution finished",
        };
      }

      return {
        ...state,
        events,
        logs,
        stageStates: nextStages,
        activeCommand: event.command ?? state.activeCommand,
        error: event.error || state.error,
        report: event.report || state.report,
        retryCount: event.report?.retryCount ?? state.retryCount,
      };
    }),
  resetRun: () => set(initialState),
}));
