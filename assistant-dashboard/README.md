# Assistant Dashboard

Twiney's forked OpenClaw assistant control panel. Manage tasks, track tokens, optimize costs, and configure multiple AI models from a beautiful web interface.

## Features

✨ **Real-Time Dashboard**
- Live token usage tracking
- Active task queue with status
- Cost breakdown by model
- System status monitoring

🤖 **Multi-AI Router**
- Claude (primary, paid)
- Ollama (local, free)
- Mistral (cheap alternative)
- Groq (lightning fast)
- Smart auto-routing: complex → Claude, simple → free model

💾 **Task Management**
- Execute prompts with automatic model selection
- Task history & detailed analytics
- Token usage per task
- Cost tracking

⚙️ **Easy Setup**
- UI-based API key management
- No code configuration needed
- Dark/light theme toggle
- Responsive design (mobile-friendly)

📊 **Analytics**
- Token burn rate visualization
- Cost per model comparison
- Savings recommendations
- Historical data tracking

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server + API
npm run dev

# Open http://localhost:5173
```

### Production Deployment

#### Option 1: Render.com (Recommended)

```bash
# Push to GitHub
git push origin main

# Create Render service
# - Root directory: assistant-dashboard
# - Build command: npm install && npm run build
# - Start command: npm start
# - Environment: set API keys in Render dashboard
```

#### Option 2: Docker

```bash
docker build -t assistant-dashboard .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  assistant-dashboard
```

#### Option 3: Local Machine

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
MISTRAL_API_KEY=your-mistral-key
GROQ_API_KEY=your-groq-key
OLLAMA_URL=http://localhost:11434  # For local Ollama
PORT=3000
```

## API Endpoints

- `POST /api/ai/execute` - Execute a task
- `GET /api/ai/:taskId` - Get task status
- `POST /api/ai/stream` - Stream response (SSE)
- `GET /api/status` - System status
- `GET /api/tokens/stats` - Token usage stats
- `GET /api/tokens/history` - Token usage history
- `GET /api/history` - Task history
- `POST /api/settings/keys/:provider` - Update API key
- `GET /api/settings/providers/available` - Available models

## Token Pricing

| Model | Input | Output |
|-------|-------|--------|
| Claude | $0.003/1K | $0.015/1K |
| Mistral | $0.00007/1K | $0.0002/1K |
| Groq | $0.00005/1K | $0.00015/1K |
| Ollama | FREE | FREE |

## Architecture

```
assistant-dashboard/
├── server/
│   ├── index.js           # Express app & routes
│   ├── db.js             # SQLite wrapper
│   └── routes/
│       ├── ai-router.js  # AI execution & model selection
│       ├── tasks.js      # Task management
│       └── settings.js   # Settings & keys
├── src/
│   ├── components/       # React components
│   ├── styles/          # CSS styles
│   └── main.jsx         # Entry point
├── package.json
├── vite.config.js       # Vite bundler config
└── index.html
```

## How It Works

1. **You enter a prompt** in the dashboard
2. **Smart router selects model**:
   - Simple prompts → Ollama (free)
   - Complex prompts → Claude (best quality)
3. **Task executes asynchronously**
4. **Results stream in real-time**
5. **Costs & tokens tracked automatically**
6. **Dashboard shows analytics**

## Optimization Tips

- Use "auto" router mode for cost savings
- Batch similar prompts together
- Monitor token burn rate
- Switch expensive tasks to free models when possible
- Review savings recommendations in settings

## License

MIT - Use freely in your workflows
