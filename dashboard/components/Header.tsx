"use client";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

export function Header() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <p className={styles.schoolLabel}>Greenfield Public School</p>
        <h2 className={styles.pageTitle}>Operations Dashboard</h2>
      </div>
      <div className={styles.topBarRight}>
        <span className={styles.timeDisplay}>{time || "—"}</span>
        <span className={styles.statusPill}>
          <span className={styles.schoolDot} />
          Systems Live
        </span>
      </div>
    </div>
  );
}
