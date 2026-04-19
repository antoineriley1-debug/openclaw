const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Get all settings
  router.get('/', async (req, res) => {
    try {
      // In production, fetch from DB and exclude encrypted values
      const settings = {
        theme: await db.getSetting('theme') || 'dark',
        routerStrategy: await db.getSetting('router_strategy') || 'smart',
        autoSelectModel: await db.getSetting('auto_select_model') === '1',
      };
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update setting
  router.post('/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (!value) {
        return res.status(400).json({ error: 'Value required' });
      }

      await db.setSetting(key, value);
      res.json({ key, value });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update API keys
  router.post('/keys/:provider', async (req, res) => {
    try {
      const { provider } = req.params;
      const { key } = req.body;

      if (!key) {
        return res.status(400).json({ error: 'Key required' });
      }

      const settingKey = `api_key_${provider}`;
      await db.setSetting(settingKey, key);
      
      res.json({ provider, status: 'saved' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get configured providers
  router.get('/providers/available', async (req, res) => {
    try {
      const providers = {
        claude: !!process.env.ANTHROPIC_API_KEY,
        ollama: !!process.env.OLLAMA_URL,
        mistral: !!process.env.MISTRAL_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
      };
      res.json(providers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
