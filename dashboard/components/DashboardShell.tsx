import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import styles from "./dashboard.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Header />
        {children}
      </main>
    </div>
  );
}
