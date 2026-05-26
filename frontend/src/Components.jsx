const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export function TodoCard({ text, priority = "medium", status }) {
  if (status === "inProgress") {
    return (
      <div style={styles.card}>
        <div style={styles.skeleton} />
        <div style={{ ...styles.skeleton, width: "60%", marginTop: 6 }} />
      </div>
    );
  }
  return (
    <div style={styles.card}>
      <span style={{ ...styles.dot, background: PRIORITY_COLOR[priority] }} />
      <div>
        <div style={styles.cardTitle}>{text}</div>
        <div style={styles.cardSub}>{priority} priority · added</div>
      </div>
    </div>
  );
}

export function StatsCard({ todos, status }) {
  if (status === "inProgress") return <div style={styles.card}><div style={styles.skeleton} /></div>;
  const done = todos.filter(t => t.done).length;
  const pct = todos.length ? Math.round((done / todos.length) * 100) : 0;
  return (
    <div style={styles.card}>
      <div style={styles.statsRow}>
        <Stat label="Total" value={todos.length} color="#7c6af7" />
        <Stat label="Done" value={done} color="#22c55e" />
        <Stat label="Remaining" value={todos.length - done} color="#f59e0b" />
      </div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${pct}%` }} />
      </div>
      <div style={styles.cardSub}>{pct}% complete</div>
    </div>
  );
}

export function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={styles.cardSub}>{label}</div>
    </div>
  );
}

export function ConfirmCard({ id, text, status, onConfirm }) {
  if (status === "inProgress") return <div style={styles.card}><div style={styles.skeleton} /></div>;
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Delete &quot;{text}&quot;?</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={styles.btnDanger} onClick={() => onConfirm(id)}>Delete</button>
        <button style={styles.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

// ── 2. Styles object ──────────────────────────────────────────────────────────
export const styles = {
  card: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
    background: "var(--copilot-kit-background-color,#1c1c27)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
    margin: "2px 0", minWidth: 220
  },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "#072475" },
  cardSub: { fontSize: 11, color: "#6b6b80", marginTop: 2 },
  statsRow: { display: "flex", gap: 24, justifyContent: "center", marginBottom: 10, width: "100%" },
  barTrack: { width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 },
  barFill: { height: "100%", background: "#7c6af7", borderRadius: 2, transition: "width 0.4s" },
  skeleton: { height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 4, width: "80%" },
  btnDanger: {
    padding: "6px 14px", background: "#ef4444", border: "none", borderRadius: 6,
    color: "#fff", fontSize: 12, cursor: "pointer"
  },
  btnGhost: {
    padding: "6px 14px", background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
    color: "#6b6b80", fontSize: 12, cursor: "pointer"
  },
};