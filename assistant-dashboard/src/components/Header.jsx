export default function Header({ theme, setTheme, status }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-emoji">⚡</span>
          <h1>Assistant Dashboard</h1>
        </div>
        {status && (
          <div className="status-badge">
            <span className={`status-dot ${status.online ? 'online' : 'offline'}`}></span>
            <span className="status-text">
              {status.online ? 'Online' : 'Offline'}
            </span>
            {status.tasks > 0 && (
              <span className="task-count">{status.tasks} task{status.tasks !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
