import { AlertTriangle } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./ErrorPage.module.css";

export default function ErrorPage() {
  const errorMessage = useTestStore((s) => s.errorMessage);

  return (
    <div className={styles.page}>
      <SkippoHeader />
      <div className={styles.center}>
        <AlertTriangle size={40} className={styles.icon} />
        <p className={styles.title}>Something went wrong</p>
        <p className={styles.body}>
          {errorMessage ?? "This test link may be invalid or has already been used."}
        </p>
        <p className={styles.hint}>
          Please close this window and tap the link in your Skippo notification again.
          If the problem persists, contact your teacher.
        </p>
      </div>
    </div>
  );
}
