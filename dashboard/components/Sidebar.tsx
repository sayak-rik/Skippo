"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardModules } from "../lib/modules";
import styles from "./dashboard.module.css";

const NAV_ITEMS = [
  { href: "/dashboard",                    icon: "⊞",  label: "Dashboard"      },
  { href: "/dashboard/students",           icon: "👤",  label: "Students"       },
  { href: "/dashboard/teachers",           icon: "📋",  label: "Teachers"       },
  { href: "/dashboard/drivers",            icon: "🚌",  label: "Drivers"        },
  { href: "/dashboard/live-fleet",         icon: "🛰",  label: "Live Fleet"     },
  { href: "/dashboard/dismissal",          icon: "🚗",  label: "Car Pickup"     },
  { href: "/dashboard/routes",             icon: "🗺",  label: "Routes"         },
  { href: "/dashboard/calls",              icon: "📞",  label: "Call Mgmt"      },
  { href: "/dashboard/communications",     icon: "📡",  label: "Communications" },
  { href: "/dashboard/compliance",         icon: "🛡",  label: "Compliance"     },
  { href: "/dashboard/reports",            icon: "📊",  label: "Reports"        },
  { href: "/dashboard/settings",           icon: "⚙",  label: "Settings"       },
];

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
          <div>
            <div className={styles.brandName}>Skippo</div>
            <div className={styles.schoolName}>Sunshine Public School</div>
          </div>
          <span className={styles.schoolChevron}>▾</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.navSection}>
        <p className={styles.navLabel}>Navigation</p>
        <div className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.academicYearPicker}>
          <div className={styles.academicYearIcon}>🎓</div>
          <div>
            <div className={styles.academicYearLabel}>Academic Year</div>
            <div className={styles.academicYearValue}>2024 – 25</div>
          </div>
          <span style={{ marginLeft: "auto", color: "var(--ink-dim)", fontSize: 12 }}>▾</span>
        </div>
      </div>
    </aside>
  );
}
