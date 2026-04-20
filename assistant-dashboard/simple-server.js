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
  <title>⚡ Assistant</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 10px rgba(0, 114, 206, 0.3); } 50% { box-shadow: 0 0 20px rgba(0, 114, 206, 0.6); } }
    @keyframes thinking { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    @keyframes slide-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #0a0e27; color: #00ff88; overflow: hidden; }
    .grid { position: fixed; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.02; background-image: linear-gradient(0deg, transparent 24%, rgba(0,255,136,.1) 25%, rgba(0,255,136,.1) 26%, transparent 27%, transparent 74%, rgba(0,255,136,.1) 75%, rgba(0,255,136,.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,255,136,.1) 25%, rgba(0,255,136,.1) 26%, transparent 27%, transparent 74%, rgba(0,255,136,.1) 75%, rgba(0,255,136,.1) 76%, transparent 77%, transparent); background-size: 50px 50px; pointer-events: none; z-index: 0; }
    .container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; padding: 2rem; }
    .head { text-align: center; margin-bottom: 3rem; }
    .title { font-size: 2.5rem; font-weight: bold; text-shadow: 0 0 10px #00ff88; margin-bottom: 0.5rem; }
    .input-zone { width: 100%; max-width: 600px; margin-bottom: 2rem; }
    textarea { width: 100%; padding: 1rem; background: rgba(0, 255, 136, 0.05); border: 2px solid #00ff88; color: #00ff88; font-family: 'Courier New', monospace; font-size: 1rem; resize: none; height: 120px; outline: none; transition: all 0.3s; box-shadow: 0 0 10px rgba(0,255,136,0.1); }
    textarea:focus { box-shadow: 0 0 20px rgba(0,255,136,0.3); border-color: #00ffff; }
    textarea::placeholder { color: #00ff88; opacity: 0.5; }
    .controls { display: flex; gap: 1rem; margin-top: 1rem; }
    button { padding: 0.75rem 1.5rem; background: rgba(0,255,136,0.1); border: 2px solid #00ff88; color: #00ff88; font-family: 'Courier New', monospace; cursor: pointer; transition: all 0.3s; font-weight: bold; }
    button:hover { background: rgba(0,255,136,0.2); box-shadow: 0 0 15px rgba(0,255,136,0.4); }
    button:active { transform: scale(0.95); }
    .thinking { animation: thinking 1s infinite; color: #00ffff; }
    .thinking::before { content: '▮'; margin-right: 0.5rem; }
    .output { width: 100%; max-width: 600px; padding: 1.5rem; background: rgba(0, 255, 136, 0.05); border: 2px solid #00ff88; border-radius: 4px; min-height: 100px; max-height: 300px; overflow-y: auto; margin-top: 2rem; animation: slide-in 0.5s; line-height: 1.6; }
    .output::-webkit-scrollbar { width: 8px; }
    .output::-webkit-scrollbar-track { background: rgba(0,255,136,0.1); }
    .output::-webkit-scrollbar-thumb { background: #00ff88; }
    .status { margin-top: 1rem; font-size: 0.9rem; color: #00ffff; }
    .error { color: #ff0055; }
    .success { color: #00ff88; }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="container">
    <div class="head">
      <div class="title">⚡ ASSISTANT</div>
      <div style="color: #00ffff; font-size: 0.9rem;">thinking engine v1.0</div>
    </div>
    
    <div class="input-zone">
      <textarea id="prompt" placeholder="> enter your query..." onkeydown="if (event.ctrlKey && event.key === 'Enter') submit('auto')"></textarea>
      <div class="controls">
        <button onclick="submit('auto')">⚡ AUTO</button>
        <button onclick="submit('claude')">🧠 CLAUDE</button>
        <button onclick="clear()">✕ CLEAR</button>
      </div>
    </div>

    <div id="status" class="status"></div>
    <div id="output" class="output" style="display:none;"></div>
  </div>

  <script>
    function getComplexity(prompt) {
      const length = prompt.length;
      const codeKeywords = ['code', 'function', 'debug', 'error', 'algorithm', 'api', 'database', 'sql', 'python', 'javascript'];
      const analysisKeywords = ['analyze', 'explain', 'research', 'compare', 'evaluate', 'summary', 'report', 'write'];
      const simpleKeywords = ['hello', 'thanks', 'what', 'when', 'where', 'how', 'who'];
      
      let complexity = 0;
      const lowerPrompt = prompt.toLowerCase();
      
      // Check for code/complex keywords
      codeKeywords.forEach(k => {
        if (lowerPrompt.includes(k)) complexity += 3;
      });
      
      // Check for analysis keywords
      analysisKeywords.forEach(k => {
        if (lowerPrompt.includes(k)) complexity += 2;
      });
      
      // Check for simple keywords
      simpleKeywords.forEach(k => {
        if (lowerPrompt.includes(k)) complexity -= 1;
      });
      
      // Length factor
      if (length > 200) complexity += 2;
      if (length > 500) complexity += 2;
      
      return Math.max(0, complexity);
    }

    function selectModel(autoMode) {
      if (!autoMode) return 'claude';
      const prompt = document.getElementById('prompt').value;
      const complexity = getComplexity(prompt);
      // complexity < 3 = simple (use free/fast), >= 3 = complex (use Claude)
      return complexity >= 3 ? 'claude' : 'ollama';
    }

    function submit(mode) {
      const prompt = document.getElementById('prompt').value.trim();
      if (!prompt) return;
      
      const output = document.getElementById('output');
      const status = document.getElementById('status');
      
      const model = mode === 'auto' ? selectModel(true) : mode;
      const modelName = model === 'claude' ? '🧠 CLAUDE' : '⚙️ FAST';
      
      output.style.display = 'none';
      status.innerHTML = '<span class="thinking">PROCESSING [' + modelName + ']</span>';
      
      fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          status.innerHTML = '<span class="error">ERROR: ' + data.error + '</span>';
          return;
        }
        poll(data.taskId);
      })
      .catch(err => status.innerHTML = '<span class="error">ERROR: ' + err.message + '</span>');
    }

    function poll(taskId) {
      setTimeout(() => {
        fetch('/api/ai/' + taskId)
          .then(r => r.json())
          .then(task => {
            if (task.status === 'completed') {
              document.getElementById('output').innerHTML = task.result;
              document.getElementById('output').style.display = 'block';
              document.getElementById('status').innerHTML = '<span class="success">✓ DONE</span>';
            } else if (task.status === 'failed') {
              document.getElementById('status').innerHTML = '<span class="error">ERROR: ' + task.result + '</span>';
            } else {
              poll(taskId);
            }
          });
      }, 500);
    }

    function clear() {
      document.getElementById('prompt').value = '';
      document.getElementById('output').style.display = 'none';
      document.getElementById('status').innerHTML = '';
      document.getElementById('prompt').focus();
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
