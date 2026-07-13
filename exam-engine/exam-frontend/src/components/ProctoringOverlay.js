import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, Users, Smartphone, Eye } from "lucide-react";
import { useTestStore } from "../store/useTestStore";
import styles from "./ProctoringOverlay.module.css";
const MESSAGES = {
    multiple_people: {
        icon: _jsx(Users, { size: 22 }),
        title: "Multiple people detected",
        body: "Only the registered student may be visible on screen during the test.",
    },
    phone_detected: {
        icon: _jsx(Smartphone, { size: 22 }),
        title: "Communication device detected",
        body: "Please put away your phone or headset before continuing.",
    },
    looking_away: {
        icon: _jsx(Eye, { size: 22 }),
        title: "Please look at the screen",
        body: "Keep your eyes on the test at all times.",
    },
};
export function ProctoringOverlay() {
    const alert = useTestStore((s) => s.proctoringAlert);
    if (!alert)
        return null;
    const { icon, title, body } = MESSAGES[alert] ?? {
        icon: _jsx(AlertTriangle, { size: 22 }),
        title: "Proctoring alert",
        body: alert,
    };
    const isCritical = alert === "multiple_people" || alert === "phone_detected";
    return (_jsx("div", { className: isCritical ? styles.overlayBlocking : styles.overlayWarning, children: _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.iconWrap, children: icon }), _jsxs("div", { children: [_jsx("p", { className: styles.title, children: title }), _jsx("p", { className: styles.body, children: body })] })] }) }));
}
