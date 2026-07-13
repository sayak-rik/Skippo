import { Clock, BookOpen, Award } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./ResultsPage.module.css";

const GRADE_MESSAGES: Record<string, { emoji: string; line: string }> = {
  "A+": { emoji: "🏆", line: "Outstanding! Keep up the excellent work." },
  "A":  { emoji: "🌟", line: "Great job! You've done really well." },
  "B+": { emoji: "👍", line: "Good work! A little more practice and you'll ace it." },
  "B":  { emoji: "👍", line: "Well done! Keep studying and you'll improve further." },
  "C+": { emoji: "💪", line: "Not bad! Review the topics you found difficult." },
  "C":  { emoji: "💪", line: "Keep working hard — you're getting there." },
  "D":  { emoji: "📚", line: "Don't give up. Extra practice will help a lot." },
  "F":  { emoji: "📚", line: "This is a learning opportunity. Ask your teacher for help." },
};

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ResultsPage() {
  const {
    score, maxScore, percentage, grade, completionReason,
    questions, answers, durationSeconds, timeRemaining,
  } = useTestStore();

  const timeTaken = durationSeconds - timeRemaining;
  const msg = GRADE_MESSAGES[grade ?? "F"] ?? { emoji: "📚", line: "Keep learning!" };

  return (
    <div className={styles.page}>
      <SkippoHeader />

      <main className={styles.main}>
        {/* Score hero */}
        <div className={styles.hero}>
          <p className={styles.emoji}>{msg.emoji}</p>
          <div className={styles.scoreRing} data-grade={grade}>
            <span className={styles.scoreNum}>{Math.round(percentage ?? 0)}%</span>
            <span className={styles.scoreLabel}>Score</span>
          </div>
          <p className={styles.grade}>{grade}</p>
          <p className={styles.encouragement}>{msg.line}</p>
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Award size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{score?.toFixed(0)} / {maxScore}</span>
            <span className={styles.statLabel}>Points</span>
          </div>
          <div className={styles.stat}>
            <BookOpen size={18} className={styles.statIcon} />
            <span className={styles.statValue}>
              {Object.keys(answers).length} / {questions.length}
            </span>
            <span className={styles.statLabel}>Answered</span>
          </div>
          <div className={styles.stat}>
            <Clock size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{fmt(Math.max(0, timeTaken))}</span>
            <span className={styles.statLabel}>Time taken</span>
          </div>
        </div>

        {/* Completion reason */}
        {completionReason === "time_expired" && (
          <div className={styles.reasonBanner}>
            <Clock size={14} />
            The test ended because time ran out. Unanswered questions were scored 0.
          </div>
        )}

        {/* Question review (MCQ only — show correct/incorrect) */}
        {questions.some((q) => q.question_type === "mcq") && (
          <div className={styles.reviewSection}>
            <p className={styles.reviewTitle}>Question Review</p>
            <div className={styles.reviewList}>
              {questions.map((q) => {
                if (q.question_type !== "mcq") return null;
                const givenAnswer = answers[q.id];
                const isAnswered = Boolean(givenAnswer);
                return (
                  <div key={q.id} className={styles.reviewItem}>
                    <span className={styles.reviewNum}>Q{q.order}</span>
                    <span className={styles.reviewText}>{q.question_text}</span>
                    {isAnswered ? (
                      <span className={styles.reviewAnswer}>
                        Selected: <strong>{givenAnswer}</strong>
                      </span>
                    ) : (
                      <span className={styles.reviewSkipped}>Not answered</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer message */}
        <p className={styles.footerNote}>
          Your result has been sent to your teacher. Close this window when you're done.
        </p>
      </main>
    </div>
  );
}
