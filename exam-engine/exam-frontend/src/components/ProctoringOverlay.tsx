import { AlertTriangle, Users, Smartphone, Eye } from "lucide-react";
import { useTestStore } from "../store/useTestStore";
import styles from "./ProctoringOverlay.module.css";

const MESSAGES: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
  multiple_people: {
    icon: <Users size={22} />,
    title: "Multiple people detected",
    body: "Only the registered student may be visible on screen during the test.",
  },
  phone_detected: {
    icon: <Smartphone size={22} />,
    title: "Communication device detected",
    body: "Please put away your phone or headset before continuing.",
  },
  looking_away: {
    icon: <Eye size={22} />,
    title: "Please look at the screen",
    body: "Keep your eyes on the test at all times.",
  },
};

export function ProctoringOverlay() {
  const alert = useTestStore((s) => s.proctoringAlert);
  if (!alert) return null;
  const { icon, title, body } = MESSAGES[alert] ?? {
    icon: <AlertTriangle size={22} />,
    title: "Proctoring alert",
    body: alert,
  };
  const isCritical = alert === "multiple_people" || alert === "phone_detected";

  return (
    <div className={isCritical ? styles.overlayBlocking : styles.overlayWarning}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>{icon}</div>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.body}>{body}</p>
        </div>
      </div>
    </div>
  );
}
