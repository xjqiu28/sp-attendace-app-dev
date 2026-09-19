import './StatusMessage.scss';

export default function StatusMessage({ text, type }) {
  if (!text) {
    return <div className="status" />;
  }

  return <div className={`status ${type || ''}`.trim()}>{text}</div>;
}
