import { useState } from 'react';
import { getDirectorView, generatePersonalCodes } from '../api/attendanceApi.js';

function networkErrorText(err) {
  return err.name === 'AbortError'
    ? 'This is taking too long. Please try again.'
    : 'Network error — please try again.';
}

// All state + network calls for the director dashboard, kept out of
// the component so DirectorDashboard.jsx can stay focused on layout.
export default function useDirectorDashboard() {
  const [selectedName, setSelectedName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { text, type: 'error' }

  // Once logged in, the validated credentials are kept here so the
  // Daily/Weekly toggle and week picker can re-fetch without asking again.
  const [credentials, setCredentials] = useState(null); // { name, code }
  const [mode, setMode] = useState('daily'); // 'daily' | 'weekly'
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const [generateCodesState, setGenerateCodesState] = useState({
    loading: false,
    message: null,
    error: null,
  });

  async function loadView(activeCredentials, nextMode, weekNumber) {
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const result = await getDirectorView(
        activeCredentials.name,
        activeCredentials.code,
        nextMode,
        weekNumber
      );

      if (result.success) {
        setDashboardData(result);
      } else {
        setDashboardError(result.error);
      }
    } catch (err) {
      setDashboardError(networkErrorText(err));
    } finally {
      setDashboardLoading(false);
    }
  }

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
      const result = await getDirectorView(selectedName, trimmedCode, 'daily');

      if (result.success) {
        setStatus(null);
        setCredentials({ name: selectedName, code: trimmedCode });
        setMode('daily');
        setDashboardData(result);
      } else {
        setStatus({ text: result.error, type: 'error' });
      }
    } catch (err) {
      setStatus({ text: networkErrorText(err), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleModeChange(newMode) {
    if (!credentials) {
      return;
    }

    setMode(newMode);
    loadView(credentials, newMode);
  }

  function handleWeekChange(weekNumber) {
    if (!credentials) {
      return;
    }

    loadView(credentials, 'weekly', weekNumber);
  }

  function handleLogOut() {
    setCredentials(null);
    setDashboardData(null);
    setCode('');
    setGenerateCodesState({ loading: false, message: null, error: null });
  }

  async function handleGenerateCodes() {
    if (!credentials) {
      return;
    }

    setGenerateCodesState({ loading: true, message: null, error: null });

    try {
      const result = await generatePersonalCodes(credentials.name, credentials.code);

      if (result.success) {
        setGenerateCodesState({ loading: false, message: result.message, error: null });
      } else {
        setGenerateCodesState({ loading: false, message: null, error: result.error });
      }
    } catch (err) {
      setGenerateCodesState({ loading: false, message: null, error: networkErrorText(err) });
    }
  }

  return {
    selectedName,
    setSelectedName,
    code,
    setCode,
    submitting,
    status,
    credentials,
    mode,
    dashboardData,
    dashboardLoading,
    dashboardError,
    generateCodesState,
    handleSubmit,
    handleModeChange,
    handleWeekChange,
    handleLogOut,
    handleGenerateCodes,
  };
}
