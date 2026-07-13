import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./ErrorPage.module.css";
export default function ErrorPage() {
    const errorMessage = useTestStore((s) => s.errorMessage);
    return (_jsxs("div", { className: styles.page, children: [_jsx(SkippoHeader, {}), _jsxs("div", { className: styles.center, children: [_jsx(AlertTriangle, { size: 40, className: styles.icon }), _jsx("p", { className: styles.title, children: "Something went wrong" }), _jsx("p", { className: styles.body, children: errorMessage ?? "This test link may be invalid or has already been used." }), _jsx("p", { className: styles.hint, children: "Please close this window and tap the link in your Skippo notification again. If the problem persists, contact your teacher." })] })] }));
}
