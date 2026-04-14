import Link from "next/link";
import { dashboardModules } from "../lib/modules";
import styles from "./dashboard.module.css";

const navIcons: Record<string, string> = {
  "Live Fleet": "🛰",
  "Students": "👤",
  "Teachers": "📋",
  "Drivers": "🚌",
  "Routes": "🗺",
  "Communications": "📡",
  "Compliance": "🛡",
  "Reports": "📊",
  "Settings": "⚙",
};

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>SK</div>
          <span className={styles.brandName}>Skippo</span>
        </div>
        <div className={styles.schoolChip}>
          <span className={styles.schoolDot} />
          Greenfield Public School
        </div>
      </div>

      <nav className={styles.navSection}>
        <p className={styles.navLabel}>Navigation</p>
        <div className={styles.navList}>
          <Link className={styles.navLink} href="/dashboard">
            <span className={styles.navIcon}>⊞</span>
            Overview
          </Link>
          {dashboardModules.map((module) => (
            <Link key={module.href} className={styles.navLink} href={module.href}>
              <span className={styles.navIcon}>{navIcons[module.title] ?? "○"}</span>
              {module.title}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
