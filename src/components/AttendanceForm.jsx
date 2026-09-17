import { useEffect, useState } from 'react';
import { fetchNames, submitAttendance } from '../api/attendanceApi.js';
import StatusMessage from './StatusMessage.jsx';

export default function AttendanceForm() {
  const [names, setNames] = useState([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [namesLoadFailed, setNamesLoadFailed] = useState(false);

  const [selectedName, setSelectedName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { text, type: 'success' | 'error' }

  useEffect(() => {
    let isMounted = true;

    fetchNames()
      .then((fetchedNames) => {
        if (isMounted) {
          setNames(fetchedNames);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNamesLoadFailed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setNamesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedCode = code.trim();

    if (!selectedName || !trimmedCode) {
      setStatus({ text: 'Please select your name and enter your personal code.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setStatus({ text: 'Checking...', type: '' });

    try {
      const result = await submitAttendance(selectedName, trimmedCode);

      if (result.success) {
        setStatus({ text: result.message, type: 'success' });
        setCode('');
      } else {
        setStatus({ text: result.error, type: 'error' });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus({
          text: "This is taking too long. Please check the sheet before submitting again — your entry may have already gone through.",
          type: 'error',
        });
      } else {
        setStatus({ text: 'Network error — please try again.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const namesUnavailable = !namesLoading && names.length === 0;

  return (
    <div className="card">
      <h1>Attendance</h1>
      <p className="sub">
        Select your name and enter your personal code — sign-in or sign-out is
        detected automatically.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full Name</label>
        <select
          id="name"
          value={selectedName}
          onChange={(event) => setSelectedName(event.target.value)}
          disabled={namesLoading || namesUnavailable}
        >
          {namesLoading && <option value="">Loading names...</option>}

          {namesUnavailable && (
            <option value="">{namesLoadFailed ? "Couldn't load names" : 'No names found'}</option>
          )}

          {!namesLoading && !namesUnavailable && (
            <>
              <option value="">Select your name</option>
              {names.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </>
          )}
        </select>

        <label htmlFor="code">Personal Code</label>
        <input
          type="text"
          id="code"
          placeholder="e.g. A12345"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />

        <button type="submit" disabled={submitting}>
          Submit
        </button>
      </form>

      {namesLoadFailed && !status ? (
        <StatusMessage text="Couldn't load the name list — check the Web App URL." type="error" />
      ) : (
        <StatusMessage text={status?.text} type={status?.type} />
      )}
    </div>
  );
}
