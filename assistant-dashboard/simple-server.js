#!/usr/bin/env node
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

// In-memory storage
const tasks = [];
const tokenUsage = [];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Routes
  if (pathname === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      online: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      tasks: tasks.filter(t => t.status === 'pending').length
    }));
  } else if (pathname === '/api/ai/execute' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { prompt, model = 'auto' } = JSON.parse(body);
        if (!prompt) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Prompt required' }));
          return;
        }

        const taskId = Math.random().toString(36).substr(2, 9);
        const task = { 
          id: taskId, 
          prompt, 
          model: model === 'auto' ? 'ollama' : model,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        tasks.push(task);

        // Call Claude API
        (async () => {
          try {
            const { Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({
              apiKey: process.env.ANTHROPIC_API_KEY
            });

            const message = await client.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              messages: [
                { role: 'user', content: prompt }
              ]
            });

            const t = tasks.find(x => x.id === taskId);
            if (t) {
              t.status = 'completed';
              t.result = message.content[0].type === 'text' ? message.content[0].text : 'No response';
              t.tokensUsed = message.usage.output_tokens + message.usage.input_tokens;
              t.cost = (message.usage.input_tokens * 0.003 + message.usage.output_tokens * 0.015) / 1000;
              t.completedAt = new Date().toISOString();
            }
          } catch (err) {
            const t = tasks.find(x => x.id === taskId);
            if (t) {
              t.status = 'failed';
              t.result = `Error: ${err.message}`;
              t.completedAt = new Date().toISOString();
            }
          }
        })();

        res.writeHead(200);
        res.end(JSON.stringify({ taskId, status: 'pending', model: task.model }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (pathname.match(/^\/api\/ai\/[a-z0-9]+$/)) {
    const taskId = pathname.split('/').pop();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Task not found' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(task));
  } else if (pathname === '/api/tokens/stats') {
    res.writeHead(200);
    res.end(JSON.stringify({}));
  } else if (pathname === '/api/history') {
    res.writeHead(200);
    res.end(JSON.stringify({ history: tasks }));
  } else if (pathname === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Assistant Dashboard</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #0072ce; margin-bottom: 1.5rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    textarea { width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; color: #f1f5f9; border-radius: 0.25rem; font-family: inherit; resize: vertical; }
    button { background: #0072ce; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.25rem; cursor: pointer; font-weight: 600; margin: 0.5rem 0.5rem 0 0; }
    button:hover { background: #0056a8; }
    .result { background: #0f172a; padding: 1rem; border-radius: 0.25rem; margin-top: 1rem; white-space: pre-wrap; word-wrap: break-word; }
    .status { padding: 0.75rem; background: #fef3c7; color: #92400e; border-radius: 0.25rem; margin-top: 0.5rem; }
    .error { background: #fee2e2; color: #991b1b; }
    .success { background: #dcfce7; color: #166534; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #334155; }
    .tab { padding: 0.75rem 1rem; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { color: #0072ce; border-bottom-color: #0072ce; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #334155; }
    th { font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ Assistant Dashboard</h1>

    <div class="tabs">
      <button class="tab active" onclick="showTab('chat')">💬 Chat</button>
      <button class="tab" onclick="showTab('history')">📈 History</button>
    </div>

    <div id="chat" class="tab-content active">
      <div class="card">
        <h2>💬 Chat with Your Bot</h2>
        <textarea id="prompt" placeholder="Ask me anything..." rows="4"></textarea>
        <div>
          <button onclick="execute('auto')">🤖 Auto (Free)</button>
          <button onclick="execute('claude')">🧠 Claude</button>
        </div>
        <div id="status"></div>
        <div id="result"></div>
      </div>
    </div>

    <div id="history" class="tab-content">
      <div class="card">
        <h2>📈 Task History</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Prompt</th>
              <th>Model</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody id="historyTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function showTab(name) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById(name).classList.add('active');
      event.target.classList.add('active');
      if (name === 'history') loadHistory();
    }

    function execute(model) {
      const prompt = document.getElementById('prompt').value;
      if (!prompt) return alert('Enter a prompt');

      const statusEl = document.getElementById('status');
      const resultEl = document.getElementById('result');
      statusEl.innerHTML = '<div class="status">⏳ Executing...</div>';
      resultEl.innerHTML = '';

      fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          statusEl.innerHTML = '<div class="status error">❌ ' + data.error + '</div>';
          return;
        }
        statusEl.innerHTML = '<div class="status">🔄 Model: ' + data.model + ' | Task: ' + data.taskId + '</div>';
        pollTask(data.taskId);
      })
      .catch(err => {
        statusEl.innerHTML = '<div class="status error">❌ ' + err.message + '</div>';
      });
    }

    function pollTask(taskId) {
      const resultEl = document.getElementById('result');
      const maxAttempts = 30;
      let attempts = 0;

      function poll() {
        fetch('/api/ai/' + taskId)
          .then(r => r.json())
          .then(task => {
            if (task.status === 'completed') {
              resultEl.innerHTML = '<div class="result">' + task.result + '</div>';
              document.getElementById('status').innerHTML = '<div class="status success">✅ Done</div>';
            } else if (task.status === 'failed') {
              resultEl.innerHTML = '<div class="result">Error: ' + task.result + '</div>';
              document.getElementById('status').innerHTML = '<div class="status error">❌ Failed</div>';
            } else if (++attempts < maxAttempts) {
              setTimeout(poll, 500);
            }
          });
      }
      poll();
    }

    function loadHistory() {
      fetch('/api/history')
        .then(r => r.json())
        .then(data => {
          const tbody = document.getElementById('historyTable');
          tbody.innerHTML = '';
          data.history.forEach(task => {
            const row = tbody.insertRow();
            row.innerHTML = '<td>' + (task.status === 'completed' ? '✅' : task.status === 'failed' ? '❌' : '⏳') + '</td>' +
              '<td>' + task.prompt.substring(0, 50) + '</td>' +
              '<td>' + task.model + '</td>' +
              '<td>' + new Date(task.createdAt).toLocaleTimeString() + '</td>';
          });
        });
    }
  </script>
</body>
</html>
    `);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
