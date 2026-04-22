"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardModules } from "../lib/modules";
import styles from "./dashboard.module.css";

const navIcons: Record<string, string> = {
  "Live Fleet":      "🛰",
  "Car Pickup":      "🚗",
  "Students":        "👤",
  "Teachers":        "📋",
  "Drivers":         "🚌",
  "Routes":          "🗺",
  "Communications":  "📡",
  "Compliance":      "🛡",
  "Reports":         "📊",
  "Settings":        "⚙",
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
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

      {/* Nav */}
      <nav className={styles.navSection}>
        <p className={styles.navLabel}>Navigation</p>
        <div className={styles.navList}>
          <Link
            href="/dashboard"
            className={`${styles.navLink} ${isActive("/dashboard") ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon}>⊞</span>
            Overview
          </Link>
          {dashboardModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className={`${styles.navLink} ${isActive(module.href) ? styles.navLinkActive : ""}`}
            >
              <span className={styles.navIcon}>{navIcons[module.title] ?? "○"}</span>
              {module.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.footerPill}>
          <span className={styles.footerDot} />
          <span>All systems live</span>
        </div>
        <p className={styles.footerVersion}>Skippo v2.1</p>
      </div>
    </aside>
  );
}
