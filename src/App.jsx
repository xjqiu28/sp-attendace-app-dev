import { useState } from 'react';
import AttendanceForm from './components/AttendanceForm.jsx';
import WeeklyHoursForm from './components/WeeklyHoursForm.jsx';

// Simple tab-based view switch for now — no routing library needed
// yet. Each page re-validates name + code itself (no shared login
// session), which keeps this simple until real auth gets added.
export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="app">
      <nav className="tabs">
        <button
          type="button"
          className={activeTab === 'attendance' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button
          type="button"
          className={activeTab === 'hours' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('hours')}
        >
          My Hours
        </button>
      </nav>

      {activeTab === 'attendance' ? <AttendanceForm /> : <WeeklyHoursForm />}
    </div>
  );
}
