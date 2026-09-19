import '@/App.scss'; // .tab, reused here for the base button look
import './GenerateCodesButton.scss';

export default function GenerateCodesButton({ state, onClick }) {
  return (
    <div className="generate-codes">
      <button
        type="button"
        className="tab generate-codes-button"
        onClick={onClick}
        disabled={state.loading}
      >
        {state.loading ? 'Generating...' : 'Generate New Codes'}
      </button>

      {state.message && <p className="generate-codes-message success">{state.message}</p>}
      {state.error && <p className="generate-codes-message error">{state.error}</p>}
    </div>
  );
}
