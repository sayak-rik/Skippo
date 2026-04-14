import { DashboardShell } from "../../components/DashboardShell";
import { MetricCard } from "../../components/MetricCard";
import { ModuleCard } from "../../components/ModuleCard";
import { dashboardModules } from "../../lib/modules";
import styles from "../../components/dashboard.module.css";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <h3>See the whole school at once.</h3>
          <p>
            Transport activity, teacher attendance signals, compliance risk, and parent-facing communications
            stay connected here so administrators can move from alert to action without switching tools.
          </p>
        </div>
        <div className={styles.heroSide}>
          <h4>Today&apos;s operating focus</h4>
          <p>
            Open active tracking, monitor school entry and exit events, follow unread teacher comments, and
            review urgent renewal deadlines before dispatch closes.
          </p>
        </div>
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="Active Trips" value="1" detail="Fleet tracking is ready to open from the dashboard." />
        <MetricCard label="Unread Teacher Notes" value="1" detail="Parent-facing comments still awaiting review." />
        <MetricCard label="Urgent Renewals" value="1" detail="Vehicle fitness certificate is close to expiry." />
        <MetricCard label="Linked Surfaces" value="5" detail="Parent, driver, teacher, dashboard, and backend." />
      </section>

      <section>
        <h3 className={styles.sectionTitle}>School Modules</h3>
        <div className={styles.moduleGrid}>
          {dashboardModules.map((module) => (
            <ModuleCard key={module.href} {...module} />
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
