import useDirectorDashboard from '../hooks/useDirectorDashboard.js';
import LoginCard from './LoginCard.jsx';
import StatusMessage from './StatusMessage.jsx';
import DailyView from './DailyView.jsx';
import WeeklyView from './WeeklyView.jsx';
import GenerateCodesButton from './GenerateCodesButton.jsx';

export default function DirectorDashboard({ names, namesLoading, namesLoadFailed }) {
  const {
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
  } = useDirectorDashboard();

  if (!credentials) {
    return (
      <LoginCard
        title="Director View"
        subtitle="Enter your name and personal code to view attendance."
        names={names}
        namesLoading={namesLoading}
        namesLoadFailed={namesLoadFailed}
        selectedName={selectedName}
        onNameChange={setSelectedName}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="View Dashboard"
        status={status}
      />
    );
  }

  const heading =
    mode === 'daily'
      ? `Attendance — ${dashboardData?.date || ''}`
      : `Weekly Totals — Week ${dashboardData?.weekNumber || ''}`;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{heading}</h1>

        <div className="dashboard-header-actions">
          <GenerateCodesButton state={generateCodesState} onClick={handleGenerateCodes} />
          <button type="button" className="tab" onClick={handleLogOut}>
            Log out
          </button>
        </div>
      </div>

      <div className="tabs dashboard-mode-tabs">
        <button
          type="button"
          className={mode === 'daily' ? 'tab active' : 'tab'}
          onClick={() => handleModeChange('daily')}
        >
          Daily
        </button>
        <button
          type="button"
          className={mode === 'weekly' ? 'tab active' : 'tab'}
          onClick={() => handleModeChange('weekly')}
        >
          Weekly
        </button>
      </div>

      {dashboardError && <StatusMessage text={dashboardError} type="error" />}

      {dashboardLoading ? (
        <StatusMessage text="Loading..." type="" />
      ) : mode === 'daily' ? (
        <DailyView data={dashboardData} />
      ) : (
        <WeeklyView data={dashboardData} onWeekChange={handleWeekChange} />
      )}
    </div>
  );
}
