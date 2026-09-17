import { useState } from 'react';
import { checkWeeklyHours } from '../api/attendanceApi.js';
import useNames from '../hooks/useNames.js';
import NameAndCodeFields from './NameAndCodeFields.jsx';
import StatusMessage from './StatusMessage.jsx';

export default function WeeklyHoursForm() {
  const { names, loading: namesLoading, failed: namesLoadFailed } = useNames();

  const [selectedName, setSelectedName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { text, type: 'error' } — only used for errors
  const [result, setResult] = useState(null); // { name, days, weekTotal } on success

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedCode = code.trim();

    if (!selectedName || !trimmedCode) {
      setStatus({ text: 'Please select your name and enter your personal code.', type: 'error' });
      setResult(null);
      return;
    }

    setSubmitting(true);
    setStatus({ text: 'Checking...', type: '' });
    setResult(null);

    try {
      const response = await checkWeeklyHours(selectedName, trimmedCode);

      if (response.success) {
        setStatus(null);
        setResult(response);
      } else {
        setStatus({ text: response.error, type: 'error' });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus({ text: 'This is taking too long. Please try again.', type: 'error' });
      } else {
        setStatus({ text: 'Network error — please try again.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h1>My Hours</h1>
      <p className="sub">
        Select your name and enter your personal code to see this week's hours.
      </p>

      <form onSubmit={handleSubmit}>
        <NameAndCodeFields
          names={names}
          namesLoading={namesLoading}
          namesLoadFailed={namesLoadFailed}
          selectedName={selectedName}
          onNameChange={setSelectedName}
          code={code}
          onCodeChange={setCode}
        />

        <button type="submit" disabled={submitting}>
          Check Hours
        </button>
      </form>

      {namesLoadFailed && !status && !result ? (
        <StatusMessage text="Couldn't load the name list — check the Web App URL." type="error" />
      ) : (
        <StatusMessage text={status?.text} type={status?.type} />
      )}

      {result && (
        <table className="hours-table">
          <tbody>
            {result.days.map((day) => (
              <tr key={day.date}>
                <td>{day.label}</td>
                <td className="hours-cell">{day.hours === null ? '—' : day.hours.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="hours-total-row">
              <td>Total</td>
              <td className="hours-cell">{result.weekTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
