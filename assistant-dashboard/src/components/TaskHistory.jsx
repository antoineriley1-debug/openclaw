export default function TaskHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card">
        <h2>📈 Task History</h2>
        <p className="placeholder">No tasks yet</p>
      </div>
    )
  }

  return (
    <div className="card history">
      <h2>📈 Task History</h2>

      <div className="history-table">
        <div className="table-header">
          <div className="col-status">Status</div>
          <div className="col-prompt">Prompt</div>
          <div className="col-model">Model</div>
          <div className="col-tokens">Tokens</div>
          <div className="col-cost">Cost</div>
          <div className="col-time">Time</div>
        </div>

        {history.map(task => (
          <div key={task.id} className={`table-row ${task.status}`}>
            <div className="col-status">
              {task.status === 'completed' && '✅'}
              {task.status === 'failed' && '❌'}
              {task.status === 'pending' && '⏳'}
              {task.status === 'processing' && '🔄'}
            </div>
            <div className="col-prompt" title={task.prompt}>
              {task.prompt.substring(0, 50)}...
            </div>
            <div className="col-model">{task.model}</div>
            <div className="col-tokens">{task.tokensUsed || 0}</div>
            <div className="col-cost">${(task.cost || 0).toFixed(4)}</div>
            <div className="col-time">
              {task.createdAt ? new Date(task.createdAt).toLocaleTimeString() : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
