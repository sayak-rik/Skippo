"use client";

import { useState } from "react";
import { Settings, Menu } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { NotificationsPanel } from "./NotificationsPanel";
import styles from "./dashboard.module.css";

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className={styles.topBar}>
        {/* Hamburger — mobile only */}
        <button
          className={styles.menuBtn}
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search */}
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search students, classes, payments..."
            type="search"
          />
        </div>

        {/* Right Actions */}
        <div className={styles.topBarRight}>
          <NotificationsPanel />

          <button
            className={styles.iconBtn}
            title="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={17} strokeWidth={2} />
          </button>

          <div className={styles.profileBtn}>
            <div className={styles.avatar}>A</div>
            <div className={styles.profileText}>
              <div className={styles.profileName}>Admin</div>
              <div className={styles.profileRole}>Super Admin</div>
            </div>
            <span style={{ marginLeft: 4, color: "var(--ink-dim)", fontSize: 11 }} className={styles.profileChevron}>▾</span>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
