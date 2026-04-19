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
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
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
