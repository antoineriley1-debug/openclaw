const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('./db');
const aiRouter = require('./routes/ai-router');
const tasksRouter = require('./routes/tasks');
const settingsRouter = require('./routes/settings');

dotenv.config();

const app = express();
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.init();

// API Routes
app.use('/api/tasks', tasksRouter(db));
app.use('/api/settings', settingsRouter(db));
app.use('/api/ai', aiRouter(db));

// Status endpoint
app.get('/api/status', (req, res) => {
  const status = {
    online: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tasks: db.getActiveTasks().length,
    models: {
      claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
      ollama: process.env.OLLAMA_URL ? 'configured' : 'not configured',
      mistral: process.env.MISTRAL_API_KEY ? 'configured' : 'not configured',
      groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
    },
    tokenUsage: db.getTokenStats(),
  };
  res.json(status);
});

// Token usage stats
app.get('/api/tokens/stats', (req, res) => {
  const stats = db.getTokenStats();
  res.json(stats);
});

// Token history
app.get('/api/tokens/history', (req, res) => {
  const limit = req.query.limit || 100;
  const history = db.getTokenHistory(limit);
  res.json({ history });
});

// Task history
app.get('/api/history', (req, res) => {
  const limit = req.query.limit || 50;
  const history = db.getTaskHistory(limit);
  res.json({ history });
});

// Serve static files from React build
const distPath = path.join(__dirname, '../dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback: serve a simple HTML dashboard if dist missing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Assistant Dashboard</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f1f5f9; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #0072ce; }
        .status { padding: 1rem; background: #1e293b; border-radius: 0.5rem; margin: 1rem 0; }
        button { background: #0072ce; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
        button:hover { background: #0056a8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚡ Assistant Dashboard</h1>
        <div class="status">
          <p><strong>Status:</strong> Server is running ✅</p>
          <p><strong>API:</strong> Available at /api</p>
          <p><strong>Frontend:</strong> React UI coming soon</p>
        </div>
        <h2>API Endpoints</h2>
        <ul>
          <li><code>GET /api/status</code> - System status</li>
          <li><code>POST /api/ai/execute</code> - Execute task</li>
          <li><code>GET /api/tokens/stats</code> - Token usage</li>
          <li><code>GET /api/history</code> - Task history</li>
        </ul>
        <h2>Test API</h2>
        <button onclick="testAPI()">Test /api/status</button>
        <pre id="result"></pre>
      </div>
      <script>
        function testAPI() {
          fetch('/api/status')
            .then(r => r.json())
            .then(data => {
              document.getElementById('result').innerText = JSON.stringify(data, null, 2);
            })
            .catch(err => {
              document.getElementById('result').innerText = 'Error: ' + err.message;
            });
        }
      </script>
    </body>
    </html>
  `);
});

// SPA fallback for /api/* (don't serve HTML for API calls)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
  } else {
    res.redirect('/');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Assistant Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
