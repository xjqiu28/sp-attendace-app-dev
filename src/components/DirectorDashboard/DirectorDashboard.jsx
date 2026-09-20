import useDirectorDashboard from '../../hooks/useDirectorDashboard.js';
import LoginCard from '../LoginCard/LoginCard.jsx';
import StatusMessage from '../StatusMessage/StatusMessage.jsx';
import DailyView from '../DailyView/DailyView.jsx';
import WeeklyView from '../WeeklyView/WeeklyView.jsx';
import EditDayView from '../EditDayView/EditDayView.jsx';
import GenerateCodesButton from '../GenerateCodesButton/GenerateCodesButton.jsx';
import '@/App.scss'; // .tab, reused here for the mode tabs and log-out button
import './DirectorDashboard.scss';

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
    viewMode,
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
    handleViewModeChange,
    handleWeekChange,
    handleLogOut,
    handleGenerateCodes,
    handleEditDateChange,
    handleSaveEntry,
    handleApproveWeek,
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
      : mode === 'weekly'
        ? `Weekly Totals — Week ${dashboardData?.weekNumber || ''}`
        : 'Edit Day';

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

      <div className="dashboard-mode-row">
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
          <button
            type="button"
            className={mode === 'edit' ? 'tab active' : 'tab'}
            onClick={() => handleModeChange('edit')}
          >
            Edit Day
          </button>
        </div>

        <div className="tabs view-mode-tabs">
          <button
            type="button"
            className={viewMode === 'card' ? 'tab active' : 'tab'}
            onClick={() => handleViewModeChange('card')}
          >
            Card
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'tab active' : 'tab'}
            onClick={() => handleViewModeChange('list')}
          >
            List
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <EditDayView
          date={editDate}
          onDateChange={handleEditDateChange}
          data={editDayData}
          loading={editDayLoading}
          error={editDayError}
          onSaveEntry={handleSaveEntry}
          viewMode={viewMode}
        />
      ) : (
        <>
          {dashboardError && <StatusMessage text={dashboardError} type="error" />}

          {dashboardLoading ? (
            <StatusMessage text="Loading..." type="" />
          ) : mode === 'daily' ? (
            <DailyView data={dashboardData} viewMode={viewMode} />
          ) : (
            <WeeklyView
              data={dashboardData}
              onWeekChange={handleWeekChange}
              viewMode={viewMode}
              onApproveWeek={handleApproveWeek}
            />
          )}
        </>
      )}
    </div>
  );
}
