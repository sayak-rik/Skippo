"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import styles from "./dashboard.module.css";

function SchoolAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={styles.schoolAvatarImg} />
    );
  }

  return (
    <div className={styles.schoolAvatarInitials} aria-label={name}>
      {initials}
    </div>
  );
}

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Bus,
  Radar,
  CarFront,
  Route,
  Phone,
  Radio,
  ShieldCheck,
  BarChart3,
} from "lucide-react";


const getAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan

  // Academic year starts from April
  if (month >= 3) {
    return `${year} – ${String(year + 1).slice(-2)}`;
  }

  return `${year - 1} – ${String(year).slice(-2)}`;
};

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/students",
    icon: GraduationCap,
    label: "Students",
  },
  {
    href: "/dashboard/teachers",
    icon: Users,
    label: "Teachers",
  },
  {
    href: "/dashboard/drivers",
    icon: Bus,
    label: "Drivers",
  },
  {
    href: "/dashboard/live-fleet",
    icon: Radar,
    label: "Live Fleet",
  },
  {
    href: "/dashboard/dismissal",
    icon: CarFront,
    label: "Car Pickup",
  },
  {
    href: "/dashboard/routes",
    icon: Route,
    label: "Routes",
  },
  {
    href: "/dashboard/calls",
    icon: Phone,
    label: "Call Mgmt",
  },
  {
    href: "/dashboard/communications",
    icon: Radio,
    label: "Communications",
  },
  {
    href: "/dashboard/compliance",
    icon: ShieldCheck,
    label: "Compliance",
  },
  {
    href: "/dashboard/reports",
    icon: BarChart3,
    label: "Reports",
  },
];
export function Sidebar() {
  const pathname = usePathname();
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");

  useEffect(() => {
    apiFetch<{ name: string; logo_url: string }>("/api/tenancy/school/profile")
      .then((p) => {
        setSchoolName(p.name);
        setSchoolLogoUrl(p.logo_url);
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={styles.sidebar}>
      {/* Skippo brand mark */}
      <div className={styles.brandBlock}>
        <div className={styles.logoRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Skippo" className={styles.logoMark} />
          <div>
            <div className={styles.brandName}>Skippo</div>
          </div>
        </div>
      </div>

      {/* School identity */}
      <div className={styles.schoolBlock}>
        <SchoolAvatar name={schoolName} logoUrl={schoolLogoUrl || undefined} />
        <div className={styles.schoolInfo}>
          <div className={styles.schoolName}>{schoolName}</div>
          <div className={styles.schoolRole}>Admin</div>
        </div>
        <span className={styles.schoolChevron}>▾</span>
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
              <span className={styles.navIcon}><item.icon size={18} /></span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.academicYearPicker}>
          <div className={styles.academicYearIcon}>🎓</div>
          <div className={styles.academicYearValue}>
            {getAcademicYear()}
          </div>
          <span style={{ marginLeft: "auto", color: "var(--ink-dim)", fontSize: 12 }}>▾</span>
        </div>
      </div>
    </aside>
  );
}
