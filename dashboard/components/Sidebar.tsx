import Link from "next/link";

import { dashboardModules } from "../lib/modules";
import styles from "./dashboard.module.css";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <span className={styles.brandEyebrow}>Skippo</span>
        <h1 className={styles.brandTitle}>School Command</h1>
        <p className={styles.brandCopy}>
          Live transport, academics, compliance, and parent communications in one operating layer.
        </p>
      </div>

      <nav className={styles.navList}>
        <Link className={styles.navLink} href="/dashboard">
          Overview
        </Link>
        {dashboardModules.map((module) => (
          <Link key={module.href} className={styles.navLink} href={module.href}>
            {module.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
