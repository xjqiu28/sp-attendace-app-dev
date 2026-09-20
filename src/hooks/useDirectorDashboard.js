import { useState } from 'react';
import {
  getDirectorView,
  generatePersonalCodes,
  getEditDayView,
  updateAttendanceEntry,
} from '../api/attendanceApi.js';
import { toBackendDate, toBackendDateTime, todayDateInputValue } from '../utils/dateTimeFormat.js';

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
  const [mode, setMode] = useState('daily'); // 'daily' | 'weekly' | 'edit'
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const [generateCodesState, setGenerateCodesState] = useState({
    loading: false,
    message: null,
    error: null,
  });

  // 'Edit Day' mode's own date + data, kept separate from the
  // daily/weekly dashboardData above since it's fetched independently.
  const [editDate, setEditDate] = useState(todayDateInputValue()); // <input type="date"> value
  const [editDayData, setEditDayData] = useState(null);
  const [editDayLoading, setEditDayLoading] = useState(false);
  const [editDayError, setEditDayError] = useState(null);

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

    if (newMode === 'edit') {
      loadEditDay(credentials, editDate);
    } else {
      loadView(credentials, newMode);
    }
  }

  function handleWeekChange(weekNumber) {
    if (!credentials) {
      return;
    }

    loadView(credentials, 'weekly', weekNumber);
  }

  async function loadEditDay(activeCredentials, dateInputValue) {
    setEditDayLoading(true);
    setEditDayError(null);

    try {
      const result = await getEditDayView(
        activeCredentials.name,
        activeCredentials.code,
        toBackendDate(dateInputValue)
      );

      if (result.success) {
        setEditDayData(result);
      } else {
        setEditDayError(result.error);
      }
    } catch (err) {
      setEditDayError(networkErrorText(err));
    } finally {
      setEditDayLoading(false);
    }
  }

  function handleEditDateChange(newDateInputValue) {
    setEditDate(newDateInputValue);
    loadEditDay(credentials, newDateInputValue);
  }

  // Always resolves (never rejects) with { success, message } or
  // { success: false, error } — including on a network failure — so
  // the calling card can show its own inline feedback without needing
  // its own try/catch.
  async function handleSaveEntry(targetName, signInInputValue, signOutInputValue) {
    const signInTime = toBackendDateTime(editDate, signInInputValue);
    const signOutTime = toBackendDateTime(editDate, signOutInputValue);

    let result;

    try {
      result = await updateAttendanceEntry(
        credentials.name,
        credentials.code,
        targetName,
        toBackendDate(editDate),
        signInTime,
        signOutTime
      );
    } catch (err) {
      return { success: false, error: networkErrorText(err) };
    }

    if (result.success) {
      setEditDayData((previous) => ({
        ...previous,
        entries: previous.entries.map((entry) =>
          entry.name === targetName
            ? { ...entry, signInTime: signInTime || null, signOutTime: signOutTime || null }
            : entry
        ),
      }));
    }

    return result;
  }

  function handleLogOut() {
    setCredentials(null);
    setDashboardData(null);
    setCode('');
    setGenerateCodesState({ loading: false, message: null, error: null });
    setEditDayData(null);
    setEditDayError(null);
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
    editDate,
    editDayData,
    editDayLoading,
    editDayError,
    handleSubmit,
    handleModeChange,
    handleWeekChange,
    handleLogOut,
    handleGenerateCodes,
    handleEditDateChange,
    handleSaveEntry,
  };
}
