import { useState, useEffect } from 'react'

export default function TaskQueue({ status, onRefresh }) {
  const [tasks, setTasks] = useState([])
  const [prompt, setPrompt] = useState('')
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (status?.tasks > 0) {
      fetchTasks()
    }
  }, [status])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  const handleExecute = async () => {
    if (!prompt.trim()) return

    setExecuting(true)
    try {
      const res = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'auto' }),
      })
      const data = await res.json()
      setPrompt('')
      onRefresh()
      
      // Poll for result
      pollTask(data.taskId)
    } catch (err) {
      console.error('Failed to execute:', err)
    } finally {
      setExecuting(false)
    }
  }

  const pollTask = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`)
        const task = await res.json()
        
        if (task.status === 'completed' || task.status === 'failed') {
          clearInterval(interval)
          fetchTasks()
          onRefresh()
        }
      } catch (err) {
        // ignore
      }
    }, 1000)
  }

  return (
    <div className="card task-queue">
      <h2>📋 Task Queue</h2>
      
      <div className="prompt-input">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={3}
          disabled={executing}
        />
        <button
          onClick={handleExecute}
          disabled={executing || !prompt.trim()}
          className={executing ? 'loading' : ''}
        >
          {executing ? '⏳ Processing...' : '🚀 Execute'}
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="task-list">
          <h3>Active Tasks ({tasks.length})</h3>
          {tasks.map(task => (
            <div key={task.id} className={`task-item ${task.status}`}>
              <div className="task-status">
                {task.status === 'pending' && '⏳'}
                {task.status === 'processing' && '🔄'}
                {task.status === 'completed' && '✅'}
                {task.status === 'failed' && '❌'}
              </div>
              <div className="task-prompt">
                {task.prompt.substring(0, 100)}...
              </div>
              <div className="task-meta">
                {task.model}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
