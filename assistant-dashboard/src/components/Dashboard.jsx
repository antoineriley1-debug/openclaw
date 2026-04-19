import { useState, useEffect } from 'react'
import Header from './Header'
import TokenStats from './TokenStats'
import TaskQueue from './TaskQueue'
import TaskHistory from './TaskHistory'
import Settings from './Settings'
import '../styles/dashboard.css'

export default function Dashboard({ status, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!status) return
    fetchStats()
    fetchHistory()
  }, [status])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/tokens/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?limit=50')
      const data = await res.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  return (
    <div className="dashboard">
      <Header theme={theme} setTheme={setTheme} status={status} />
      
      <div className="tabs">
        {['overview', 'tokens', 'history', 'settings'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'tokens' && '💰 Tokens & Cost'}
            {tab === 'history' && '📈 History'}
            {tab === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </div>

      <div className="content">
        {activeTab === 'overview' && (
          <div className="overview">
            <TaskQueue status={status} onRefresh={fetchStats} />
            <TokenStats stats={stats} />
          </div>
        )}

        {activeTab === 'tokens' && (
          <TokenStats stats={stats} detailed={true} />
        )}

        {activeTab === 'history' && (
          <TaskHistory history={history} />
        )}

        {activeTab === 'settings' && (
          <Settings onSave={fetchStats} />
        )}
      </div>
    </div>
  )
}
