import { useState, useEffect } from 'react'

export default function TaskExecutor({ onTaskComplete }) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('auto')
  const [executing, setExecuting] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleExecute = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setExecuting(true)
    setError(null)
    setResult(null)
    setCurrentTask(null)

    try {
      const res = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setCurrentTask(data)
      setPrompt('')

      // Poll for result
      pollTask(data.taskId)
    } catch (err) {
      setError(err.message)
      setExecuting(false)
    }
  }

  const pollTask = async (taskId) => {
    const maxAttempts = 30
    let attempts = 0

    const poll = async () => {
      try {
        const res = await fetch(`/api/ai/${taskId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        
        const task = await res.json()

        if (task.status === 'completed') {
          setResult(task.result)
          setExecuting(false)
          onTaskComplete()
          return
        } else if (task.status === 'failed') {
          setError(`Task failed: ${task.result}`)
          setExecuting(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000)
        } else {
          setError('Task timed out')
          setExecuting(false)
        }
      } catch (err) {
        setError(err.message)
        setExecuting(false)
      }
    }

    poll()
  }

  return (
    <div className="card executor">
      <h2>💬 Chat with Your Bot</h2>

      <form onSubmit={handleExecute} className="executor-form">
        <div className="form-group">
          <label>Your Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything... e.g., 'analyze this data', 'summarize the trends', etc."
            rows={4}
            disabled={executing}
            className="prompt-input"
          />
        </div>

        <div className="form-group">
          <label>Model:</label>
          <div className="model-selector">
            <button
              type="button"
              className={`model-btn ${model === 'auto' ? 'active' : ''}`}
              onClick={() => setModel('auto')}
              disabled={executing}
            >
              🤖 Auto (Smart Router)
            </button>
            <button
              type="button"
              className={`model-btn ${model === 'claude' ? 'active' : ''}`}
              onClick={() => setModel('claude')}
              disabled={executing}
            >
              🧠 Claude
            </button>
            <button
              type="button"
              className={`model-btn ${model === 'ollama' ? 'active' : ''}`}
              onClick={() => setModel('ollama')}
              disabled={executing}
            >
              🦙 Ollama (Free)
            </button>
          </div>
          <small>Auto = picks cheapest suitable model</small>
        </div>

        <button
          type="submit"
          disabled={executing || !prompt.trim()}
          className={`execute-btn ${executing ? 'loading' : ''}`}
        >
          {executing ? (
            <>
              <span className="spinner">⏳</span> Processing...
            </>
          ) : (
            <>🚀 Execute</>
          )}
        </button>
      </form>

      {error && (
        <div className="alert error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentTask && (
        <div className="status-box">
          <div className="status-item">
            <strong>Task ID:</strong>
            <code>{currentTask.taskId}</code>
          </div>
          <div className="status-item">
            <strong>Status:</strong>
            <span className="status-badge pending">
              {executing ? '⏳ Processing' : '✅ Done'}
            </span>
          </div>
          <div className="status-item">
            <strong>Model:</strong>
            <span>{currentTask.model}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="result-box">
          <h3>📤 Result</h3>
          <div className="result-content">
            {result}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result)
              alert('Copied to clipboard!')
            }}
            className="copy-btn"
          >
            📋 Copy Result
          </button>
        </div>
      )}
    </div>
  )
}
