import Link from "next/link";

import styles from "./dashboard.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.headerEyebrow}>Greenfield Public School</p>
        <h2 className={styles.headerTitle}>Operations Dashboard</h2>
      </div>
      <div className={styles.headerActions}>
        <Link className={styles.actionLink} href="http://localhost:8000/health/">
          Backend Health
        </Link>
        <Link className={styles.actionLink} href="http://localhost:8000/api/reports/parent/dashboard/">
          Parent API Demo
        </Link>
        <Link className={styles.actionLink} href="http://localhost:8000/api/tracking/fleet/live/">
          Fleet API Demo
        </Link>
      </div>
    </header>
  );
}
