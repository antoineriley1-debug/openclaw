import { useEffect, useState } from 'react'

export default function TokenStats({ stats, detailed = false }) {
  const [costs, setCosts] = useState({})

  useEffect(() => {
    if (stats) {
      const totalCost = Object.values(stats).reduce((sum, model) => sum + parseFloat(model.cost || 0), 0)
      setCosts(totalCost)
    }
  }, [stats])

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="card">
        <h2>💰 Token Usage</h2>
        <div className="placeholder">No token usage recorded yet</div>
      </div>
    )
  }

  return (
    <div className="card token-stats">
      <h2>💰 Token Usage & Cost</h2>
      
      {!detailed && (
        <div className="total-cost">
          <div className="cost-amount">${costs.toFixed(2)}</div>
          <div className="cost-label">Total spent</div>
        </div>
      )}

      <div className="models-grid">
        {Object.entries(stats).map(([model, data]) => (
          <div key={model} className="model-stat">
            <div className="model-name">
              {model === 'claude' && '🧠 Claude'}
              {model === 'ollama' && '🦙 Ollama'}
              {model === 'mistral' && '🌪️ Mistral'}
              {model === 'groq' && '⚡ Groq'}
            </div>
            <div className="tokens">{data.tokens.toLocaleString()} tokens</div>
            <div className="cost">${parseFloat(data.cost).toFixed(4)}</div>
          </div>
        ))}
      </div>

      {detailed && (
        <div className="savings-hint">
          <p>💡 Switching simple tasks to free models could save ~60% on API costs</p>
        </div>
      )}
    </div>
  )
}
