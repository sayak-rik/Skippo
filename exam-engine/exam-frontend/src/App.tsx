import { Routes, Route, Navigate } from "react-router-dom";
import WaitingRoom from "./pages/WaitingRoom";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import ErrorPage from "./pages/ErrorPage";

export default function App() {
  return (
    <Routes>
      {/* Waiting room — parse token, init session, show rules */}
      <Route path="/test/:accessToken" element={<WaitingRoom />} />

      {/* Active test — WebSocket live, MCQ / text / voice */}
      <Route path="/test/:accessToken/exam" element={<TestPage />} />

      {/* Results after completion */}
      <Route path="/test/:accessToken/done" element={<ResultsPage />} />

      {/* Error fallback */}
      <Route path="/error" element={<ErrorPage />} />

      {/* Anything else → error */}
      <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
  );
}
