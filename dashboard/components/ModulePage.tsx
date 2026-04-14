import Link from "next/link";

import styles from "./dashboard.module.css";
import { DashboardShell } from "./DashboardShell";

type ResourceLink = {
  href: string;
  label: string;
};

type ModulePageProps = {
  title: string;
  description: string;
  links: ResourceLink[];
};

export function ModulePage({ title, description, links }: ModulePageProps) {
  return (
    <DashboardShell>
      <section className={styles.pagePanel}>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className={styles.linkList}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.resourceLink}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
