import { DashboardShell } from "./DashboardShell";

type Props = {
  icon: string;
  title: string;
  description: string;
  badge?: string;
};

export function ComingSoonPage({ icon, title, description, badge }: Props) {
  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>
            {badge ?? "Module"}
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>{title}</h1>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--stroke)",
          borderRadius: "var(--radius-xl)", padding: "60px 40px",
          textAlign: "center", boxShadow: "var(--shadow-sm)",
          maxWidth: 560,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "var(--radius-lg)",
            background: "var(--primary-soft)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 24px",
          }}>
            {icon}
          </div>
          <span style={{
            display: "inline-block", background: "var(--warning-soft)",
            color: "var(--warning)", border: "1px solid var(--warning-border)",
            borderRadius: 999, padding: "4px 14px", fontSize: 11,
            fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 20,
          }}>
            Coming Soon
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
            {title} is on the way
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            {description}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
