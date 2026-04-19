const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

module.exports = (db) => {
  const router = express.Router();

  // Execute a task with automatic model selection
  router.post('/execute', async (req, res) => {
    try {
      const { prompt, model = 'auto', forceModel = null } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      // Create task record
      const task = await db.createTask(prompt, model);
      db.addActiveTask(task);

      // Select model based on strategy
      let selectedModel = forceModel;
      if (!selectedModel) {
        selectedModel = await selectModel(prompt, model, db);
      }

      // Execute asynchronously
      executeTask(task.id, prompt, selectedModel, db).catch(err => {
        console.error(`Task ${task.id} failed:`, err);
        db.updateTask(task.id, { status: 'failed', result: err.message });
      });

      res.json({ taskId: task.id, status: 'pending', model: selectedModel });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get task status
  router.get('/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      // In production, fetch from DB
      const task = db.activeTasks.find(t => t.id === taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stream response
  router.post('/stream', async (req, res) => {
    try {
      const { prompt } = req.body;
      const model = await selectModel(prompt, 'auto', db);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (model === 'claude') {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const stream = await client.messages.stream({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        stream.on('text', (text) => {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        });

        stream.on('message', (message) => {
          const usage = message.usage;
          db.recordTokenUsage('claude', usage.input_tokens + usage.output_tokens, calculateCost('claude', usage));
          res.write(`data: ${JSON.stringify({ done: true, usage })}\n\n`);
          res.end();
        });

        stream.on('error', (err) => {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        });
      } else if (model === 'ollama') {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const axios = require('axios');
        
        try {
          const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model: 'llama2',
            prompt,
            stream: true,
          }, { responseType: 'stream' });

          response.data.on('data', (chunk) => {
            try {
              const lines = chunk.toString().split('\n').filter(l => l);
              lines.forEach(line => {
                const json = JSON.parse(line);
                if (json.response) {
                  res.write(`data: ${JSON.stringify({ text: json.response })}\n\n`);
                }
                if (json.done) {
                  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                  res.end();
                }
              });
            } catch (e) {
              // ignore parse errors
            }
          });
        } catch (err) {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        }
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

async function selectModel(prompt, strategy, db) {
  // Simple heuristic: if prompt < 200 chars, use free model, otherwise claude
  if (strategy === 'auto') {
    return prompt.length < 200 ? 'ollama' : 'claude';
  } else if (strategy === 'claude') {
    return 'claude';
  } else if (strategy === 'free') {
    return 'ollama';
  }
  return 'claude';
}

async function executeTask(taskId, prompt, model, db) {
  // Mark as processing
  db.updateTask(taskId, { status: 'processing' });
  db.removeActiveTask(taskId);

  try {
    if (model === 'claude') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const result = response.content[0].text;
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const cost = calculateCost('claude', response.usage);

      db.recordTokenUsage('claude', tokensUsed, cost);
      db.updateTask(taskId, { status: 'completed', result, tokensUsed, cost });
    }
    // Add other models here
  } catch (err) {
    db.updateTask(taskId, { status: 'failed', result: err.message });
  }
}

function calculateCost(model, usage) {
  const costs = {
    claude: { input: 0.003 / 1000, output: 0.015 / 1000 }, // Per token
    ollama: { input: 0, output: 0 }, // Free
    mistral: { input: 0.00007 / 1000, output: 0.0002 / 1000 },
    groq: { input: 0.00005 / 1000, output: 0.00015 / 1000 },
  };

  const rate = costs[model];
  if (!rate) return 0;

  return (usage.input_tokens * rate.input) + (usage.output_tokens * rate.output);
}
