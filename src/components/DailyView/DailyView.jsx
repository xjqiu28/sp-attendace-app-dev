import DailySummary from '../DailySummary/DailySummary.jsx';
import AttendanceCard from '../AttendanceCard/AttendanceCard.jsx';
import '@/styles/CardGrid.scss';

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
