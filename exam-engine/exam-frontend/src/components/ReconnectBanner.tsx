import { Wifi, WifiOff } from "lucide-react";
import { useTestStore } from "../store/useTestStore";
import styles from "./ReconnectBanner.module.css";

export function ReconnectBanner() {
  const wsStatus = useTestStore((s) => s.wsStatus);
  if (wsStatus === "connected") return null;

  return (
    <div className={wsStatus === "reconnecting" ? styles.reconnecting : styles.connecting}>
      {wsStatus === "reconnecting" ? (
        <>
          <WifiOff size={14} />
          <span>Connection lost — reconnecting…</span>
        </>
      ) : (
        <>
          <Wifi size={14} />
          <span>Connecting…</span>
        </>
      )}
    </div>
  );
}
