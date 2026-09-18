function SummaryNameList({ title, names, emptyText }) {
  return (
    <div className="summary-list">
      <h2 className="summary-list-title">
        {title} ({names.length})
      </h2>

      {names.length === 0 ? (
        <p className="summary-list-empty">{emptyText}</p>
      ) : (
        <ul className="summary-list-items">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DailySummary({ totalRoster, totalSignedIn, absentNames, lateNames }) {
  return (
    <div className="daily-summary">
      <div className="summary-stat">
        <span className="summary-stat-value">
          {totalSignedIn} / {totalRoster}
        </span>
        <span className="summary-stat-label">Signed In</span>
      </div>

      <SummaryNameList title="Absent" names={absentNames} emptyText="Everyone has signed in." />
      <SummaryNameList title="Signed In Late" names={lateNames} emptyText="No late sign-ins today." />
    </div>
  );
}
