"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/src/lib/config";
import { useRunStore, type RunEvent } from "@/src/Zustand_Store/runStore";

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: false,
      withCredentials: true,
    });
  }

  return socket;
}

export function useAgentRunSocket(runId?: string) {
  const setConnectionStatus = useRunStore((state) => state.setConnectionStatus);
  const ingestEvent = useRunStore((state) => state.ingestEvent);
  const setRunId = useRunStore((state) => state.setRunId);
  const resetRun = useRunStore((state) => state.resetRun);

  useEffect(() => {
    if (!runId) return;

    resetRun();
    const client = getSocket();
    setRunId(runId);
    setConnectionStatus("connecting");

    const handleConnect = () => {
      setConnectionStatus("connected");
      client.emit("join-run", runId);
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleError = () => {
      setConnectionStatus("error");
    };

    const handleEvent = (event: RunEvent) => {
      ingestEvent({ ...event, runId: event.runId || runId });
    };

    client.on("connect", handleConnect);
    client.on("disconnect", handleDisconnect);
    client.on("connect_error", handleError);
    client.on("agent:event", handleEvent);

    if (!client.connected) {
      client.connect();
    } else {
      handleConnect();
    }

    return () => {
      client.off("connect", handleConnect);
      client.off("disconnect", handleDisconnect);
      client.off("connect_error", handleError);
      client.off("agent:event", handleEvent);
    };
  }, [ingestEvent, runId, setConnectionStatus, setRunId]);
}
