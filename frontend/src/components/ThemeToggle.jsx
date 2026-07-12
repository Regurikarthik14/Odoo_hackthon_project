import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
      <div className="toggle-track">
        <span className="toggle-icon sun">☀️</span>
        <span className="toggle-icon moon">🌙</span>
        <div className={`toggle-thumb ${darkMode ? 'dark' : 'light'}`}></div>
      </div>
    </button>
  );
}
