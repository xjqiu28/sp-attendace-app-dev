import { useState } from 'react';

// Backend stores times as "M/d/yyyy h:mm:ss a" — pull out just the
// "h:mm a" part for a cleaner display (e.g. "5:38 PM").
function formatTimeOnly(dateTimeString) {
  if (!dateTimeString) {
    return null;
  }

  const parts = dateTimeString.split(' ');

  if (parts.length < 3) {
    return dateTimeString;
  }

  const [hour, minute] = parts[1].split(':');
  return `${hour}:${minute} ${parts[2]}`;
}

export default function WeeklyTotalCard({ entry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="attendance-card weekly-card"
      onClick={() => setExpanded((previous) => !previous)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          setExpanded((previous) => !previous);
        }
      }}
    >
      <div className="attendance-card-header">
        <span className="attendance-card-name">{entry.name}</span>
        <span className="expand-indicator">{expanded ? '▲' : '▼'}</span>
      </div>

      <div className="attendance-card-row">
        <span className="attendance-card-label">Total Hours</span>
        <span className="attendance-card-total">{entry.weekTotalFormatted}</span>
      </div>

      {expanded && (
        <div className="weekly-breakdown">
          {entry.days.map((day) => (
            <div key={day.date} className="weekly-breakdown-row">
              <div className="weekly-breakdown-top">
                <span className="weekly-breakdown-day">{day.label}</span>
                <span>
                  {day.signInTime
                    ? `${formatTimeOnly(day.signInTime)} - ${
                        day.signOutTime ? formatTimeOnly(day.signOutTime) : '—'
                      }`
                    : 'Not signed in'}
                </span>
              </div>

              {day.hoursFormatted && <div className="weekly-breakdown-hours">{day.hoursFormatted}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
