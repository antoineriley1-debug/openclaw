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
            <span>{status.online ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>

      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
