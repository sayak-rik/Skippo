import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "../config";

/**
 * Manages the WebSocket connection for the classroom.
 * Returns state + action dispatchers.
 */
const useClassroomWebSocket = ({ classroomId, studentName, onMessage }) => {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendBinary = useCallback((bytes) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(bytes);
    }
  }, []);

  useEffect(() => {
    const url = `${WS_BASE}/ws/classroom/${classroomId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join", name: studentName }));
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current?.(data);
      } catch {
        // binary — not expected from server
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 20000);

    return () => {
      clearInterval(ping);
      ws.close();
    };
  }, [classroomId, studentName]);

  return { connected, send, sendBinary };
};

export default useClassroomWebSocket;
