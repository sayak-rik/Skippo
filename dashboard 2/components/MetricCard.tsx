import styles from "./dashboard.module.css";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  color?: "brand" | "danger" | "success" | "warning";
  badge?: string;
  badgeType?: "live" | "alert";
  variant?: "danger" | "success" | "warning" | "accent";
};

export function MetricCard({ label, value, detail, color = "brand", badge, badgeType = "live", variant }: MetricCardProps) {
  const colorClass = `${color}Color`;
  const cardClass = variant ? `${styles.kpiCard} ${styles[variant]}` : styles.kpiCard;
  return (
    <div className={cardClass}>
      {badge && (
        <span className={`${styles.kpiBadge} ${styles[badgeType]}`}>{badge}</span>
      )}
      <p className={styles.kpiLabel}>{label}</p>
      <strong className={`${styles.kpiValue} ${styles[colorClass]}`}>{value}</strong>
      <span className={styles.kpiDetail}>{detail}</span>
    </div>
  );
}
