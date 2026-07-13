import styles from "./TimerBar.module.css";

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Props {
  timeRemaining: number;
  durationSeconds: number;
}

export function TimerBar({ timeRemaining, durationSeconds }: Props) {
  const pct = durationSeconds > 0 ? (timeRemaining / durationSeconds) * 100 : 100;
  const isWarning = timeRemaining <= 300 && timeRemaining > 60;  // < 5 min
  const isDanger  = timeRemaining <= 60;                          // < 1 min

  const barClass = [
    styles.fill,
    isWarning ? styles.warning : "",
    isDanger  ? styles.danger  : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={barClass} style={{ width: `${pct}%` }} />
      </div>
      <span className={[
        styles.label,
        isWarning ? styles.labelWarning : "",
        isDanger  ? styles.labelDanger  : "",
      ].filter(Boolean).join(" ")}>
        {fmt(timeRemaining)}
      </span>
    </div>
  );
}
