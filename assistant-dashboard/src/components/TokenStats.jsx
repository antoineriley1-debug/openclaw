export default function TokenStats({ stats }) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="card">
        <h2>💰 Token Usage</h2>
        <p className="placeholder">No tasks executed yet</p>
      </div>
    )
  }

  const totalCost = Object.values(stats).reduce((sum, m) => sum + parseFloat(m.cost || 0), 0)
  const totalTokens = Object.values(stats).reduce((sum, m) => sum + (m.tokens || 0), 0)

  return (
    <div className="card token-stats">
      <h2>💰 Token Usage & Cost</h2>

      <div className="totals">
        <div className="total-item">
          <div className="total-label">Total Spent</div>
          <div className="total-value">${totalCost.toFixed(4)}</div>
        </div>
        <div className="total-item">
          <div className="total-label">Total Tokens</div>
          <div className="total-value">{totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <h3>By Model</h3>
      <div className="models-grid">
        {Object.entries(stats).map(([model, data]) => (
          <div key={model} className="model-card">
            <div className="model-header">
              {model === 'claude' && '🧠 Claude'}
              {model === 'ollama' && '🦙 Ollama'}
              {model === 'mistral' && '🌪️ Mistral'}
              {model === 'groq' && '⚡ Groq'}
              {!['claude', 'ollama', 'mistral', 'groq'].includes(model) && model}
            </div>
            <div className="model-stat">
              <span className="label">Tokens:</span>
              <span className="value">{data.tokens.toLocaleString()}</span>
            </div>
            <div className="model-stat">
              <span className="label">Cost:</span>
              <span className="value">${parseFloat(data.cost).toFixed(4)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="savings-tip">
        <p>💡 <strong>Tip:</strong> Use Auto mode to automatically route tasks to cheaper models</p>
      </div>
    </div>
  )
}
