import { useEffect, useRef, useCallback } from "react";
import { useTestStore, SyncStatePayload } from "../store/useTestStore";

const MIN_DELAY = 1_000;
const MAX_DELAY = 30_000;

interface UseTestWebSocketOptions {
  sessionId: string;
  onReady?: () => void;
}

export function useTestWebSocket({ sessionId, onReady }: UseTestWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const delay = useRef(MIN_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true); // set false on unmount to stop reconnect loop

  const { setWsStatus, applySyncState, tickTimer, setCompleted, setError } = useTestStore.getState();

  const connect = useCallback(() => {
    if (!alive.current) return;

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}/ws/test/${sessionId}`;

    setWsStatus("connecting");
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      delay.current = MIN_DELAY; // reset backoff
      setWsStatus("connected");
      // Always sync on (re)connect — server will restore full state
      socket.send(JSON.stringify({ type: "sync_request" }));
      onReady?.();
    };

    socket.onmessage = (evt) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(evt.data as string);
      } catch {
        return;
      }

      const type = data.type as string;

      if (type === "sync_state") {
        applySyncState(data as unknown as SyncStatePayload);
        return;
      }

      if (type === "timer_tick") {
        tickTimer(data.time_remaining as number);
        return;
      }

      if (type === "test_complete") {
        setCompleted(
          data.reason as string,
          data.score as number,
          data.max_score as number,
          data.percentage as number,
          data.grade as string,
        );
        return;
      }

      if (type === "answer_ack") {
        // Optimistic update already applied — nothing extra needed
        return;
      }

      if (type === "transcript") {
        // Voice transcript — dispatched via custom event so VoiceRecorder can pick it up
        window.dispatchEvent(
          new CustomEvent("exam:transcript", {
            detail: { questionId: data.question_id, text: data.text },
          })
        );
        return;
      }

      if (type === "error") {
        setError(data.error as string);
        return;
      }

      if (type === "pong") return; // heartbeat response, ignore
    };

    socket.onclose = (evt) => {
      ws.current = null;
      if (!alive.current) return;
      if (evt.wasClean) return;
      setWsStatus("reconnecting");
      reconnectTimer.current = setTimeout(() => {
        delay.current = Math.min(delay.current * 2, MAX_DELAY);
        connect();
      }, delay.current);
    };

    socket.onerror = () => {
      // onclose will fire next — nothing to do here
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    alive.current = true;
    connect();
    return () => {
      alive.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close(1000, "unmount");
    };
  }, [connect]);

  // ── Exposed helpers ──────────────────────────────────────────────

  const send = useCallback((payload: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    }
  }, []);

  const submitAnswer = useCallback(
    (questionId: string, answer: string) => {
      send({ type: "submit_answer", question_id: questionId, answer });
    },
    [send]
  );

  const submitTest = useCallback(() => {
    send({ type: "submit_test" });
  }, [send]);

  const stopRecording = useCallback(
    (questionId: string) => {
      send({ type: "stop_recording", question_id: questionId });
    },
    [send]
  );

  // Keepalive ping every 20s
  useEffect(() => {
    const id = setInterval(() => {
      send({ type: "ping", timestamp: Date.now() });
    }, 20_000);
    return () => clearInterval(id);
  }, [send]);

  return { send, sendBinary, submitAnswer, submitTest, stopRecording };
}
