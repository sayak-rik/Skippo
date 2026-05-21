"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import styles from "./dashboard.module.css";

type NotifType = "info" | "warning" | "danger" | "success";

type Notification = {
  id: number;
  type: NotifType;
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "danger",  title: "3 students absent without notice", subtitle: "Class 10-A · Today, 8:12 AM", time: "8:12 AM", read: false },
  { id: 2, type: "warning", title: "Fee payment overdue",               subtitle: "Rahul Sharma · ₹4,500 pending",    time: "Yesterday", read: false },
  { id: 3, type: "success", title: "Route 3 arrived safely",            subtitle: "All 28 students dropped off",      time: "Yesterday", read: false },
  { id: 4, type: "info",    title: "New parent registered",             subtitle: "Priya Mehta · Class 6-B",         time: "2 days ago", read: false },
  { id: 5, type: "warning", title: "Driver license expiring soon",      subtitle: "Ravi Kumar · Expires in 12 days", time: "2 days ago", read: true },
];

const TYPE_DOT: Record<NotifType, string> = {
  danger:  "var(--danger)",
  warning: "var(--warning)",
  success: "var(--success)",
  info:    "var(--primary)",
};

const TYPE_BG: Record<NotifType, string> = {
  danger:  "var(--danger-soft)",
  warning: "var(--warning-soft)",
  success: "var(--success-soft)",
  info:    "var(--primary-soft)",
};

const TYPE_EMOJI: Record<NotifType, string> = {
  danger:  "⚠️",
  warning: "🔔",
  success: "✅",
  info:    "ℹ️",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  return (
    <div ref={containerRef} className={styles.notifContainer}>
      <button
        className={`${styles.iconBtn} ${open ? styles.iconBtnActive : ""}`}
        title="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.notifDropdown}>
          <div className={styles.notifDropdownHeader}>
            <div>
              <span className={styles.notifDropdownTitle}>Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.notifUnreadChip}>{unreadCount} new</span>
              )}
            </div>
            <div className={styles.notifHeaderActions}>
              {unreadCount > 0 && (
                <button className={styles.notifTextBtn} onClick={markAllRead} title="Mark all as read">
                  <CheckCheck size={13} strokeWidth={2} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button className={`${styles.notifTextBtn} ${styles.notifTextBtnDanger}`} onClick={clearAll} title="Clear all">
                  <Trash2 size={13} strokeWidth={2} />
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className={styles.notifList}>
            {notifications.length === 0 ? (
              <div className={styles.notifEmpty}>
                <span style={{ fontSize: 32 }}>🔕</span>
                <span>All caught up!</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${n.read ? styles.notifItemRead : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div
                    className={styles.notifItemIcon}
                    style={{ background: TYPE_BG[n.type] }}
                  >
                    {TYPE_EMOJI[n.type]}
                  </div>
                  <div className={styles.notifItemBody}>
                    <div className={styles.notifItemTitle}>{n.title}</div>
                    <div className={styles.notifItemSub}>{n.subtitle}</div>
                    <div className={styles.notifItemTime}>{n.time}</div>
                  </div>
                  {!n.read && (
                    <div
                      className={styles.notifUnreadDot}
                      style={{ background: TYPE_DOT[n.type] }}
                    />
                  )}
                  <button
                    className={styles.notifDismissBtn}
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    title="Dismiss"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
