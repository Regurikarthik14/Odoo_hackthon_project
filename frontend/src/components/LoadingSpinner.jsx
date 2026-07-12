import './LoadingSpinner.css';

export default function LoadingSpinner({ fullScreen = false, text = 'Loading...' }) {
  return (
    <div className={`loading-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className="steering-wheel">
        <div className="steering-inner"></div>
        <div className="steering-spoke spoke-1"></div>
        <div className="steering-spoke spoke-2"></div>
        <div className="steering-spoke spoke-3"></div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
}
