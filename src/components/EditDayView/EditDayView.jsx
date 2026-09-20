import EditEntryCard from '../EditEntryCard/EditEntryCard.jsx';
import StatusMessage from '../StatusMessage/StatusMessage.jsx';
import '../LoginCard/LoginCard.scss'; // label/input base styles for the date field
import '../../styles/CardGrid.scss';
import './EditDayView.scss';

export default function EditDayView({ date, onDateChange, data, loading, error, onSaveEntry }) {
  return (
    <div className="edit-day">
      <div className="edit-day-date-field">
        <label htmlFor="edit-day-date">Date</label>
        <input
          type="date"
          id="edit-day-date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>

      {error && <StatusMessage text={error} type="error" />}

      {loading ? (
        <StatusMessage text="Loading..." type="" />
      ) : (
        data && (
          <div className="card-grid">
            {data.entries.map((entry) => (
              <EditEntryCard key={entry.name} entry={entry} onSave={onSaveEntry} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
