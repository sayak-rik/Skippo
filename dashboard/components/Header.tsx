"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { NotificationsPanel } from "./NotificationsPanel";
import styles from "./dashboard.module.css";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className={styles.topBar}>
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
            <div>
              <div className={styles.profileName}>Admin</div>
              <div className={styles.profileRole}>Super Admin</div>
            </div>
            <span style={{ marginLeft: 4, color: "var(--ink-dim)", fontSize: 11 }}>▾</span>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
