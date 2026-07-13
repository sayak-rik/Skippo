import { useState } from "react";
import { API_BASE } from "../config";
import "./JoinScreen.css";

export default function JoinScreen({ onJoined }) {
  const [mode, setMode] = useState("join"); // join | create
  const [name, setName] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subject, setSubject] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !classroomId.trim()) return;
    setError("");
    setLoading(true);

    try {
      // Verify classroom exists
      const res = await fetch(`${API_BASE}/classroom/${classroomId.trim()}`);
      if (!res.ok) {
        setError("Classroom not found. Check the ID and try again.");
        return;
      }
      const data = await res.json();
      onJoined({
        classroomId: classroomId.trim(),
        studentId: null, // assigned by server on WS join
        studentName: name.trim(),
        subject: data.subject,
        sttAvailable: true,
      });
    } catch {
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !instructions.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/classroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), instructions: instructions.trim() }),
      });
      if (!res.ok) {
        setError("Failed to create classroom.");
        return;
      }
      const data = await res.json();
      onJoined({
        classroomId: data.classroom_id,
        studentId: null,
        studentName: name.trim(),
        subject: subject.trim(),
        sttAvailable: true,
      });
    } catch {
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-logo">
          <span className="join-icon">🎓</span>
          <h1>AI Teacher</h1>
          <p>Interactive classroom powered by AI</p>
        </div>

        <div className="join-tabs">
          <button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}>
            Join Classroom
          </button>
          <button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>
            Create Classroom
          </button>
        </div>

        {mode === "join" ? (
          <form onSubmit={handleJoin} className="join-form">
            <label>
              Your Name
              <input
                type="text"
                placeholder="e.g. Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </label>
            <label>
              Classroom ID
              <input
                type="text"
                placeholder="Paste the classroom ID"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                required
              />
            </label>
            {error && <p className="join-error">{error}</p>}
            <button type="submit" disabled={loading || !name.trim() || !classroomId.trim()} className="btn-primary">
              {loading ? "Connecting…" : "Join"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="join-form">
            <label>
              Your Name
              <input
                type="text"
                placeholder="e.g. Dr. Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </label>
            <label>
              Subject
              <input
                type="text"
                placeholder="e.g. Introduction to Python"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={100}
              />
            </label>
            <label>
              Teacher Instructions
              <textarea
                placeholder="Describe the lesson, teaching style, level, and any specific goals…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                required
                rows={5}
              />
            </label>
            {error && <p className="join-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim() || !subject.trim() || !instructions.trim()}
              className="btn-primary"
            >
              {loading ? "Creating…" : "Create & Join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
