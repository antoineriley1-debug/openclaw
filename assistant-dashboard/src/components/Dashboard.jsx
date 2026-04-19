import { useState, useEffect } from 'react'
import Header from './Header'
import TaskExecutor from './TaskExecutor'
import TokenStats from './TokenStats'
import TaskHistory from './TaskHistory'
import '../styles/dashboard.css'

export default function Dashboard({ status, theme, setTheme, onRefresh }) {
  const [activeTab, setActiveTab] = useState('chat')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

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
      const res = await fetch('/api/history?limit=20')
      const data = await res.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const handleTaskComplete = () => {
    setTimeout(() => {
      fetchStats()
      fetchHistory()
    }, 1000)
  }

  return (
    <div className="dashboard">
      <Header theme={theme} setTheme={setTheme} status={status} />
      
      <div className="tabs">
        {[
          { id: 'chat', label: '💬 Chat with Bot', icon: '💬' },
          { id: 'tokens', label: '💰 Token Usage', icon: '💰' },
          { id: 'history', label: '📈 History', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        {activeTab === 'chat' && (
          <TaskExecutor onTaskComplete={handleTaskComplete} />
        )}

        {activeTab === 'tokens' && (
          <TokenStats stats={stats} />
        )}

        {activeTab === 'history' && (
          <TaskHistory history={history} />
        )}
      </div>
    </div>
  )
}
