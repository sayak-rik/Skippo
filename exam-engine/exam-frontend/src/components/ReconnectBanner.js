import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Wifi, WifiOff } from "lucide-react";
import { useTestStore } from "../store/useTestStore";
import styles from "./ReconnectBanner.module.css";
export function ReconnectBanner() {
    const wsStatus = useTestStore((s) => s.wsStatus);
    if (wsStatus === "connected")
        return null;
    return (_jsx("div", { className: wsStatus === "reconnecting" ? styles.reconnecting : styles.connecting, children: wsStatus === "reconnecting" ? (_jsxs(_Fragment, { children: [_jsx(WifiOff, { size: 14 }), _jsx("span", { children: "Connection lost \u2014 reconnecting\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsx(Wifi, { size: 14 }), _jsx("span", { children: "Connecting\u2026" })] })) }));
}
