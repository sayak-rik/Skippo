import styles from "./SkippoHeader.module.css";

interface Props {
  testTitle?: string;
}

export function SkippoHeader({ testTitle }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Skippo logomark — inline SVG so no asset dependency */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="28" height="28" rx="8" fill="#2563EB"/>
          <path d="M8 10.5C8 9.4 8.9 8.5 10 8.5H18C19.1 8.5 20 9.4 20 10.5V17.5C20 18.6 19.1 19.5 18 19.5H10C8.9 19.5 8 18.6 8 17.5V10.5Z" fill="white" fillOpacity="0.2"/>
          <path d="M11 14L13.5 16.5L17 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.wordmark}>Skippo</span>
      </div>
      {testTitle && <span className={styles.testTitle}>{testTitle}</span>}
      <span className={styles.badge}>Online Test</span>
    </header>
  );
}
