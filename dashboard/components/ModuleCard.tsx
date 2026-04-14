import Link from "next/link";

import styles from "./dashboard.module.css";

type ModuleCardProps = {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
};

export function ModuleCard({ href, title, subtitle, badge }: ModuleCardProps) {
  return (
    <Link className={styles.moduleCard} href={href}>
      <span className={styles.moduleBadge}>{badge}</span>
      <h3 className={styles.moduleTitle}>{title}</h3>
      <p className={styles.moduleSubtitle}>{subtitle}</p>
      <span className={styles.moduleLink}>Open module</span>
    </Link>
  );
}
