import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [theme, setTheme] = useState('dark')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  return (
    <div className={`app ${theme}`}>
      <Dashboard status={status} theme={theme} setTheme={setTheme} onRefresh={fetchStatus} />
    </div>
  )
}

export default App
