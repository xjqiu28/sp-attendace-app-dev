import DailySummary from './DailySummary.jsx';
import AttendanceCard from './AttendanceCard.jsx';

export default function DailyView({ data }) {
  return (
    <>
      <DailySummary
        totalRoster={data.totalRoster}
        totalSignedIn={data.totalSignedIn}
        absentNames={data.absentNames}
        lateNames={data.lateNames}
      />

      <div className="card-grid">
        {data.entries.map((entry) => (
          <AttendanceCard key={entry.name} entry={entry} />
        ))}
      </div>
    </>
  );
}
