function SummaryNameList({ title, items, emptyText, renderItem }) {
  return (
    <div className="summary-list">
      <h2 className="summary-list-title">
        {title} ({items.length})
      </h2>

      {items.length === 0 ? (
        <p className="summary-list-empty">{emptyText}</p>
      ) : (
        <ul className="summary-list-items">
          {items.map((item) => {
            const name = typeof item === 'string' ? item : item.name;
            return <li key={name}>{renderItem ? renderItem(item) : name}</li>;
          })}
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

      <SummaryNameList title="Absent" items={absentNames} emptyText="Everyone has signed in." />
      <SummaryNameList
        title="Signed In Late"
        items={lateNames}
        emptyText="No late sign-ins today."
        renderItem={(entry) => (
          <>
            {entry.name}
            {entry.lateBy && <span className="summary-list-detail"> — {entry.lateBy} late</span>}
          </>
        )}
      />
    </div>
  );
}
