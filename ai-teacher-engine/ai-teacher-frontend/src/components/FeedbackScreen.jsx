import { useState } from "react";
import { API_BASE } from "../config";
import "./FeedbackScreen.css";

export default function FeedbackScreen({ classId, studentName, subject }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, student_name: studentName, rating, comment }),
      });
    } catch {
      // best-effort
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-screen">
        <div className="feedback-card">
          <div className="feedback-icon">✓</div>
          <h2>Thank you!</h2>
          <p>Your feedback has been recorded.</p>
          <p className="feedback-sub">You can close this window now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-screen">
      <div className="feedback-card">
        <div className="feedback-header">
          <div className="skippo-badge">Skippo</div>
          <h2>Class Feedback</h2>
          <p>{subject || "AI Teacher Class"} · How was your experience?</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="star-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`star ${rating >= n ? "active" : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>

          <label>
            Comments (optional)
            <textarea
              placeholder="What did you like? What could be better?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </label>

          <button type="submit" disabled={rating === 0 || loading} className="btn-primary">
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>
          <button
            type="button"
            className="btn-skip"
            onClick={() => setSubmitted(true)}
          >
            Skip
          </button>
        </form>
      </div>
    </div>
  );
}
