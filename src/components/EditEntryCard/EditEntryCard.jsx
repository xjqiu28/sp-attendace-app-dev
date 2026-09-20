import { useState } from 'react';
import StatusMessage from '../StatusMessage/StatusMessage.jsx';
import { toTimeInputValue } from '../../utils/dateTimeFormat.js';
import '../AttendanceCard/AttendanceCard.scss'; // .attendance-card base look
import '../LoginCard/LoginCard.scss'; // label/input/button base styles

// One person's editable sign-in/sign-out for whichever date EditDayView
// currently has selected. Local draft state only — nothing is sent
// until Save is pressed, so switching dates elsewhere never loses or
// clobbers an in-progress edit.
export default function EditEntryCard({ entry, onSave, viewMode }) {
  const [signIn, setSignIn] = useState(toTimeInputValue(entry.signInTime));
  const [signOut, setSignOut] = useState(toTimeInputValue(entry.signOutTime));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { text, type: 'success' | 'error' }

  const fieldId = entry.name.replace(/\s+/g, '-').toLowerCase();

  async function handleSave() {
    setSaving(true);
    setStatus({ text: 'Saving...', type: '' });

    const result = await onSave(entry.name, signIn, signOut);

    if (result.success) {
      setStatus({ text: 'Saved.', type: 'success' });
    } else {
      setStatus({ text: result.error, type: 'error' });
    }

    setSaving(false);
  }

  return (
    <div className={viewMode === 'list' ? 'attendance-row' : 'attendance-card'}>
      <div className="attendance-card-header">
        <span className="attendance-card-name">{entry.name}</span>
      </div>

      <div className="attendance-card-fields">
        <div className="edit-entry-field">
          <label htmlFor={`${fieldId}-sign-in`}>Sign In</label>
          <input
            type="time"
            id={`${fieldId}-sign-in`}
            value={signIn}
            onChange={(event) => setSignIn(event.target.value)}
          />
        </div>

        <div className="edit-entry-field">
          <label htmlFor={`${fieldId}-sign-out`}>Sign Out</label>
          <input
            type="time"
            id={`${fieldId}-sign-out`}
            value={signOut}
            onChange={(event) => setSignOut(event.target.value)}
          />
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>

      <StatusMessage text={status?.text} type={status?.type} />
    </div>
  );
}
