import WeekSelector from '../WeekSelector/WeekSelector.jsx';
import WeeklyTotalCard from '../WeeklyTotalCard/WeeklyTotalCard.jsx';
import '@/styles/CardGrid.scss';

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
