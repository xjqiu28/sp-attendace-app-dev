import WeekSelector from './WeekSelector.jsx';
import WeeklyTotalCard from './WeeklyTotalCard.jsx';

export default function WeeklyView({ data, onWeekChange }) {
  return (
    <>
      <WeekSelector
        availableWeeks={data.availableWeeks}
        currentWeekNumber={data.weekNumber}
        onSelect={onWeekChange}
      />

      <div className="card-grid">
        {data.entries.map((entry) => (
          <WeeklyTotalCard key={entry.name} entry={entry} />
        ))}
      </div>
    </>
  );
}
