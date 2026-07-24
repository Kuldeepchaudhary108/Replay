"use client";

import React, { useEffect, useMemo } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/src/lib/config";
import { useAgentRunSocket } from "@/src/hooks/useAgentRunSocket";
import { useRunStore, type RunStageId } from "@/src/Zustand_Store/runStore";

interface LiveExecutionProps {
  projectId?: string;
}

const stageOrder: Array<{ id: RunStageId; label: string; detail: string }> = [
  { id: "repo", label: "Clone Repository", detail: "Repo Agent" },
  { id: "pipeline", label: "Detect Pipeline", detail: "Pipeline Detector" },
  { id: "executor", label: "Run Workflow", detail: "Pipeline Executor" },
  { id: "analyzer", label: "Analyze Failure", detail: "Failure Analyzer" },
  { id: "fixer", label: "Apply Fix", detail: "Fix Agent" },
  { id: "git", label: "Commit & Push", detail: "Git Agent" },
  { id: "complete", label: "Generate Report", detail: "Final Report" },
];

const statusStyles: Record<string, string> = {
  pending: "border-white/10 bg-white/5 text-white/50",
  running: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

function stagePercent(stage: RunStageId, status: string) {
  const base = {
    repo: 10,
    pipeline: 25,
    executor: 45,
    analyzer: 60,
    fixer: 75,
    git: 90,
    complete: 100,
  }[stage];

  if (status === "success") return base;
  if (status === "running") return Math.max(base - 5, 0);
  if (status === "failed") return Math.max(base - 10, 0);
  return Math.max(base - 15, 0);
}

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "running":
    case "RUNNING":
      return "Running";
    case "success":
    case "SUCCESS":
    case "PASSED":
      return "Completed";
    case "failed":
    case "FAILED":
      return "Failed";
    default:
      return "Pending";
  }
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export default function LiveExecution({ projectId }: LiveExecutionProps) {
  const runId = useRunStore((state) => projectId || state.runId || undefined);
  const connectionStatus = useRunStore((state) => state.connectionStatus);
  const stageStates = useRunStore((state) => state.stageStates);
  const logs = useRunStore((state) => state.logs);
  const report = useRunStore((state) => state.report);
  const error = useRunStore((state) => state.error);
  const activeCommand = useRunStore((state) => state.activeCommand);
  const hydrateSnapshot = useRunStore((state) => state.hydrateSnapshot);
  const ingestEvent = useRunStore((state) => state.ingestEvent);

  useAgentRunSocket(runId);

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;

    const hydrate = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/agent/runs/${runId}`);
        if (cancelled) return;

        const snapshot = response.data;
        hydrateSnapshot({
          report: snapshot.result || snapshot.report || null,
        });

        (snapshot.events || []).forEach((event: any) => ingestEvent(event));
      } catch (snapshotError) {
        if (!cancelled) {
          console.error("Failed to hydrate run snapshot", snapshotError);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [hydrateSnapshot, ingestEvent, runId]);

  const progress = useMemo(() => {
    const completedStages = stageOrder.filter(
      ({ id }) => stageStates[id].status === "success",
    ).length;
    const activeStages = stageOrder.filter(
      ({ id }) => stageStates[id].status === "running",
    ).length;

    return Math.min(
      100,
      Math.round((completedStages + activeStages * 0.5) * (100 / stageOrder.length)),
    );
  }, [stageStates]);

  const reportTimeline = report?.timeline || report?.iterations || [];
  const finalStatus = report?.status || (error ? "FAILED" : "RUNNING");

  if (!runId) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">Live Execution</p>
          <h1 className="mt-4 text-3xl font-semibold">Waiting for a run</h1>
          <p className="mt-3 text-sm text-white/60">
            Start a healing session from the configuration page to stream the agent lifecycle here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(194,131,131,0.12),_transparent_38%),linear-gradient(180deg,_#090909_0%,_#050505_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Autonomous CI/CD Healing Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Run {runId}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/60">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                  Socket: {connectionStatus}
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                  Status: {statusLabel(finalStatus.toLowerCase())}
                </span>
                {report?.branch ? (
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                    Branch: {report.branch}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Progress" value={`${progress}%`} />
              <Metric label="Retries" value={String(report?.retryCount ?? 0)} />
              <Metric label="Duration" value={formatDuration(report?.totalTimeSeconds)} />
              <Metric label="Score" value={report?.score?.final?.toFixed(0) || "--"} />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,_#c28383_0%,_#e0e1dd_100%)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/50">
            <span>{report?.repoUrl || "Waiting for repository data"}</span>
            <span>{activeCommand ? `Running ${activeCommand}` : "Streaming live state"}</span>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Live Agent Timeline</p>
                  <h2 className="mt-2 text-xl font-semibold">Every state is streamed from the backend</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                  {stageOrder.filter(({ id }) => stageStates[id].status === "success").length}/{stageOrder.length} steps
                </span>
              </div>

              <div className="space-y-3">
                {stageOrder.map((stage) => {
                  const state = stageStates[stage.id];
                  return (
                    <article
                      key={stage.id}
                      className={`rounded-2xl border p-4 transition-all duration-300 ${statusStyles[state.status]}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/30 text-sm">
                              {state.status === "running" ? "⏳" : state.status === "success" ? "✅" : state.status === "failed" ? "❌" : "•"}
                            </span>
                            <div>
                              <h3 className="font-medium">{stage.label}</h3>
                              <p className="text-sm text-white/60">{stage.detail}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium uppercase tracking-[0.2em]">{statusLabel(state.status)}</div>
                      </div>
                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-current transition-all duration-500"
                          style={{ width: `${stagePercent(stage.id, state.status)}%` }}
                        />
                      </div>
                      <p className="mt-3 text-sm text-white/70">{state.message}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#070707]/90 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Live Logs</p>
                  <h2 className="mt-1 text-lg font-semibold">Structured backend events</h2>
                </div>
                <span className="text-xs text-white/40">{logs.length} entries</span>
              </div>
              <div className="max-h-[32rem] overflow-y-auto px-5 py-4 font-mono text-xs leading-6 text-white/75">
                {logs.length === 0 ? (
                  <p className="text-white/40">Waiting for backend events...</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="mb-3 flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="shrink-0 text-white/35">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${log.level === "ERROR" ? "bg-rose-500/10 text-rose-300" : log.level === "SUCCESS" ? "bg-emerald-500/10 text-emerald-300" : "bg-sky-500/10 text-sky-300"}`}>
                        {log.level}
                      </span>
                      <p className="min-w-0 flex-1 break-words text-white/70">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Final Report</p>
              <h2 className="mt-2 text-xl font-semibold">Backend-generated execution summary</h2>

              {report ? (
                <div className="mt-5 space-y-4 text-sm">
                  <ReportRow label="Repository" value={report.repoUrl} />
                  <ReportRow label="Branch" value={report.branch} />
                  <ReportRow label="Retry Count" value={String(report.retryCount)} />
                  <ReportRow label="Execution Time" value={formatDuration(report.totalTimeSeconds)} />
                  <ReportRow label="Pipeline Status" value={report.status} />
                  <ReportRow label="Score" value={report.score.final.toFixed(0)} />
                  <ReportRow label="Files Modified" value={report.filesModified?.length ? report.filesModified.join(", ") : "None"} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/50">
                  Final report will populate here once the backend completes the LangGraph run.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Retry Details</p>
              <h2 className="mt-2 text-xl font-semibold">Iteration breakdown</h2>

              <div className="mt-4 space-y-3">
                {reportTimeline.length ? (
                  reportTimeline.map((item, index) => (
                    <div key={`${item.iteration}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Iteration {item.iteration}</h3>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${item.status === "PASSED" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                          {item.status}
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm text-white/65">
                        <ReportRow label="Failed Step" value={item.failedStep || "None"} compact />
                        <ReportRow label="Error Type" value={item.errorType || "None"} compact />
                        <ReportRow label="Reason" value={item.errorMessage || item.agentAction} compact />
                        <ReportRow label="Applied Fix" value={item.agentAction} compact />
                        <ReportRow label="Files Modified" value={item.filesModified?.length ? item.filesModified.join(", ") : "None"} compact />
                      </dl>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                    Retry details will appear here after the first failure.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Current Signal</p>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                {activeCommand ? `Running ${activeCommand}` : "Waiting for the next backend state transition"}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ReportRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${compact ? "text-xs" : ""}`}>
      <dt className="text-white/45">{label}</dt>
      <dd className="max-w-[70%] text-right text-white/80">{value}</dd>
    </div>
  );
}
