"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "../lib/api";
import styles from "./dashboard.module.css";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Award,
  CalendarDays,
  Clock3,
  PencilLine,
  Bus,
  Radar,
  CarFront,
  Route,
  Truck,
  Phone,
  Radio,
  ShieldCheck,
  BarChart3,
  Building2,
  Layers,
  CalendarRange,
  BookMarked,
  CreditCard,
  UserCog,
  Lock,
  Landmark,
  Settings,
  School,
  Bot,
  MonitorPlay,
} from "lucide-react";

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

const getAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) return `${year} – ${String(year + 1).slice(-2)}`;
  return `${year - 1} – ${String(year).slice(-2)}`;
};

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/dashboard/students",                    icon: GraduationCap, label: "Students" },
      { href: "/dashboard/teachers",                    icon: Users,         label: "Teachers" },
      { href: "/dashboard/classrooms",                  icon: School,        label: "Classrooms" },
      { href: "/dashboard/academics/timetable",         icon: Clock3,        label: "Timetable" },
      { href: "/dashboard/academics/homework",          icon: PencilLine,    label: "Homework" },
      { href: "/dashboard/academics/exams",             icon: ClipboardList, label: "Exams" },
      { href: "/dashboard/academics/online-tests",      icon: MonitorPlay,   label: "Online Tests" },
      { href: "/dashboard/academics/report-cards",      icon: Award,         label: "Report Cards" },
      { href: "/dashboard/ai-classes",                  icon: Bot,           label: "AI Classes" },
    ],
  },
  {
    label: "School Setup",
    items: [
      { href: "/dashboard/academics/years",    icon: CalendarRange, label: "Academic Years" },
      { href: "/dashboard/academics/subjects", icon: BookOpen,      label: "Subjects" },
      { href: "/dashboard/academics/houses",   icon: Layers,        label: "Houses" },
      { href: "/dashboard/academics/calendar", icon: CalendarDays,  label: "Calendar" },
      { href: "/dashboard/udise",              icon: Landmark,      label: "UDISE+" },
    ],
  },
  {
    label: "Transport",
    items: [
      { href: "/dashboard/live-fleet", icon: Radar,    label: "Live Fleet" },
      { href: "/dashboard/dismissal",  icon: CarFront, label: "Car Pickup" },
      { href: "/dashboard/routes",     icon: Route,    label: "Routes" },
      { href: "/dashboard/drivers",    icon: Bus,      label: "Drivers" },
      { href: "/dashboard/vehicles",   icon: Truck,    label: "Vehicles" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/staff",  icon: UserCog,    label: "Staff" },
      { href: "/dashboard/roles",  icon: Lock,       label: "Roles & Permissions" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/calls",           icon: Phone,       label: "Call Mgmt" },
      { href: "/dashboard/communications",  icon: Radio,       label: "Communications" },
      { href: "/dashboard/compliance",      icon: ShieldCheck, label: "Compliance" },
      { href: "/dashboard/reports",         icon: BarChart3,   label: "Reports" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : ""}`}>
        {/* Mobile close button */}
        <button
          className={styles.sidebarCloseBtn}
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

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
            <div className={styles.schoolName}>{schoolName || "School"}</div>
            <div className={styles.schoolRole}>Admin</div>
          </div>
          <span className={styles.schoolChevron}>▾</span>
        </div>

        {/* Nav groups */}
        <nav className={styles.navSection}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              <p className={styles.navLabel} style={{ marginTop: gi === 0 ? 4 : 16 }}>{group.label}</p>
              <div className={styles.navList}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}
                  >
                    <span className={styles.navIcon}><item.icon size={16} /></span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
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
    </>
  );
}
