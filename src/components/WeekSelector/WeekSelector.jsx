import './WeekSelector.scss';

export default function WeekSelector({ availableWeeks, currentWeekNumber, onSelect }) {
  if (!availableWeeks || availableWeeks.length === 0) {
    return null;
  }

  return (
    <div className="week-selector">
      {availableWeeks.map((week) => (
        <button
          key={week.weekNumber}
          type="button"
          className={week.weekNumber === currentWeekNumber ? 'week-button active' : 'week-button'}
          onClick={() => onSelect(week.weekNumber)}
        >
          {week.label}
        </button>
      ))}
    </div>
  );
}
