import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Clock, BookOpen, Award } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./ResultsPage.module.css";
const GRADE_MESSAGES = {
    "A+": { emoji: "🏆", line: "Outstanding! Keep up the excellent work." },
    "A": { emoji: "🌟", line: "Great job! You've done really well." },
    "B+": { emoji: "👍", line: "Good work! A little more practice and you'll ace it." },
    "B": { emoji: "👍", line: "Well done! Keep studying and you'll improve further." },
    "C+": { emoji: "💪", line: "Not bad! Review the topics you found difficult." },
    "C": { emoji: "💪", line: "Keep working hard — you're getting there." },
    "D": { emoji: "📚", line: "Don't give up. Extra practice will help a lot." },
    "F": { emoji: "📚", line: "This is a learning opportunity. Ask your teacher for help." },
};
function fmt(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
export default function ResultsPage() {
    const { score, maxScore, percentage, grade, completionReason, questions, answers, durationSeconds, timeRemaining, } = useTestStore();
    const timeTaken = durationSeconds - timeRemaining;
    const msg = GRADE_MESSAGES[grade ?? "F"] ?? { emoji: "📚", line: "Keep learning!" };
    return (_jsxs("div", { className: styles.page, children: [_jsx(SkippoHeader, {}), _jsxs("main", { className: styles.main, children: [_jsxs("div", { className: styles.hero, children: [_jsx("p", { className: styles.emoji, children: msg.emoji }), _jsxs("div", { className: styles.scoreRing, "data-grade": grade, children: [_jsxs("span", { className: styles.scoreNum, children: [Math.round(percentage ?? 0), "%"] }), _jsx("span", { className: styles.scoreLabel, children: "Score" })] }), _jsx("p", { className: styles.grade, children: grade }), _jsx("p", { className: styles.encouragement, children: msg.line })] }), _jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.stat, children: [_jsx(Award, { size: 18, className: styles.statIcon }), _jsxs("span", { className: styles.statValue, children: [score?.toFixed(0), " / ", maxScore] }), _jsx("span", { className: styles.statLabel, children: "Points" })] }), _jsxs("div", { className: styles.stat, children: [_jsx(BookOpen, { size: 18, className: styles.statIcon }), _jsxs("span", { className: styles.statValue, children: [Object.keys(answers).length, " / ", questions.length] }), _jsx("span", { className: styles.statLabel, children: "Answered" })] }), _jsxs("div", { className: styles.stat, children: [_jsx(Clock, { size: 18, className: styles.statIcon }), _jsx("span", { className: styles.statValue, children: fmt(Math.max(0, timeTaken)) }), _jsx("span", { className: styles.statLabel, children: "Time taken" })] })] }), completionReason === "time_expired" && (_jsxs("div", { className: styles.reasonBanner, children: [_jsx(Clock, { size: 14 }), "The test ended because time ran out. Unanswered questions were scored 0."] })), questions.some((q) => q.question_type === "mcq") && (_jsxs("div", { className: styles.reviewSection, children: [_jsx("p", { className: styles.reviewTitle, children: "Question Review" }), _jsx("div", { className: styles.reviewList, children: questions.map((q, i) => {
                                    if (q.question_type !== "mcq")
                                        return null;
                                    const givenAnswer = answers[q.id];
                                    const isAnswered = Boolean(givenAnswer);
                                    return (_jsxs("div", { className: styles.reviewItem, children: [_jsxs("span", { className: styles.reviewNum, children: ["Q", q.order] }), _jsx("span", { className: styles.reviewText, children: q.question_text }), isAnswered ? (_jsxs("span", { className: styles.reviewAnswer, children: ["Selected: ", _jsx("strong", { children: givenAnswer })] })) : (_jsx("span", { className: styles.reviewSkipped, children: "Not answered" }))] }, q.id));
                                }) })] })), _jsx("p", { className: styles.footerNote, children: "Your result has been sent to your teacher. Close this window when you're done." })] })] }));
}
