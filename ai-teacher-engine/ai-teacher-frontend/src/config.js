export const API_BASE = import.meta.env.VITE_API_BASE || "";
export const WS_BASE = import.meta.env.VITE_WS_BASE ||
  (window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + window.location.host;
