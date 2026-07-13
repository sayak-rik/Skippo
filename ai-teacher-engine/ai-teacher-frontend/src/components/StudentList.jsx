import "./StudentList.css";

export default function StudentList({ students, queue, activeQuestioner, myId }) {
  return (
    <div className="student-list">
      <div className="sl-section">
        <h3 className="sl-title">
          Students <span className="sl-count">{students.length}</span>
        </h3>
        <ul className="sl-students">
          {students.length === 0 && (
            <li className="sl-empty">No students yet</li>
          )}
          {students.map((s) => {
            const isActive = activeQuestioner?.id === s.id;
            const inQueue = queue.some((q) => q.id === s.id);
            const isMe = s.id === myId;
            return (
              <li key={s.id} className={`sl-student ${isActive ? "active" : ""} ${isMe ? "me" : ""}`}>
                <span className="sl-avatar">{s.name[0]?.toUpperCase()}</span>
                <span className="sl-name">
                  {s.name}
                  {isMe && <span className="sl-you">you</span>}
                </span>
                {isActive && <span className="sl-badge speaking">🎤</span>}
                {!isActive && inQueue && <span className="sl-badge queued">✋</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {queue.length > 0 && (
        <div className="sl-section">
          <h3 className="sl-title">
            Question Queue <span className="sl-count">{queue.length}</span>
          </h3>
          <ol className="sl-queue">
            {queue.map((s, i) => (
              <li key={s.id} className={`sl-queue-item ${s.id === myId ? "me" : ""}`}>
                <span className="sl-queue-pos">{i + 1}</span>
                <span>{s.name}</span>
                {s.id === myId && <span className="sl-you">you</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
