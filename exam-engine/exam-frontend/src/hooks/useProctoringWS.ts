import { useEffect, useRef, useCallback } from "react";
import { useTestStore } from "../store/useTestStore";

const FRAME_INTERVAL_MS = 5_000; // capture every 5 seconds

export function useProctoringWS(sessionId: string, enabled: boolean) {
  const ws = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const setProctoringAlert = useTestStore((s) => s.setProctoringAlert);

  const captureAndSend = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.readyState || ws.current?.readyState !== WebSocket.OPEN) return;

    if (!canvas.current) {
      canvas.current = document.createElement("canvas");
    }
    const c = canvas.current;
    c.width = 320;
    c.height = 240;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 240);
    const base64 = c.toDataURL("image/jpeg", 0.7).split(",")[1];

    ws.current.send(
      JSON.stringify({ base64, camera_width: 320, camera_height: 240 })
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    // Request camera access
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        // Hidden video element to draw frames from
        const vid = document.createElement("video");
        vid.srcObject = stream;
        vid.muted = true;
        vid.playsInline = true;
        vid.play();
        videoRef.current = vid;

        // Open proctoring WebSocket
        const proto = location.protocol === "https:" ? "wss" : "ws";
        ws.current = new WebSocket(`${proto}://${location.host}/ws/proctoring/${sessionId}`);

        ws.current.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data as string);
            const { looking_away, people_count, communication_device, severity } = data;
            if (severity === "critical") {
              if (people_count > 1) setProctoringAlert("multiple_people");
              else if (communication_device) setProctoringAlert("phone_detected");
            } else if (severity === "warning" && looking_away) {
              setProctoringAlert("looking_away");
            } else {
              setProctoringAlert(null);
            }
          } catch { /* ignore */ }
        };

        ws.current.onclose = () => {
          // Proctoring WS closed — stop capturing
          if (intervalRef.current) clearInterval(intervalRef.current);
        };

        intervalRef.current = setInterval(captureAndSend, FRAME_INTERVAL_MS);
      })
      .catch(() => {
        // Camera permission denied — proceed without proctoring
      });

    return () => {
      alive = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      ws.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, sessionId, captureAndSend, setProctoringAlert]);
}
