import AttendanceForm from './components/AttendanceForm.jsx';

// This is intentionally the single place that decides what's on
// screen. When auth and extra views get added later, this is where
// routing (e.g. react-router) and a "logged in?" check will live —
// everything else stays a self-contained component underneath it.
export default function App() {
  return <AttendanceForm />;
}
