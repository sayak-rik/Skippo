import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "./TimerBar.module.css";
function fmt(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
export function TimerBar({ timeRemaining, durationSeconds }) {
    const pct = durationSeconds > 0 ? (timeRemaining / durationSeconds) * 100 : 100;
    const isWarning = timeRemaining <= 300 && timeRemaining > 60; // < 5 min
    const isDanger = timeRemaining <= 60; // < 1 min
    const barClass = [
        styles.fill,
        isWarning ? styles.warning : "",
        isDanger ? styles.danger : "",
    ].filter(Boolean).join(" ");
    return (_jsxs("div", { className: styles.wrapper, children: [_jsx("div", { className: styles.track, children: _jsx("div", { className: barClass, style: { width: `${pct}%` } }) }), _jsx("span", { className: [
                    styles.label,
                    isWarning ? styles.labelWarning : "",
                    isDanger ? styles.labelDanger : "",
                ].filter(Boolean).join(" "), children: fmt(timeRemaining) })] }));
}
