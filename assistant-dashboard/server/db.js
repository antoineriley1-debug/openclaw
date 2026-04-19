// In-memory database (no sqlite3 required)
class Database {
  constructor() {
    this.tasks = [];
    this.tokenUsage = [];
    this.settings = {
      api_key_anthropic: '',
      api_key_ollama_url: '',
      api_key_mistral: '',
      api_key_groq: '',
      router_strategy: 'smart',
      auto_select_model: '1',
      theme: 'dark',
    };
    this.activeTasks = [];
  }

  init() {
    // No-op for in-memory
  }

  createTask(prompt, model = 'auto') {
    const id = require('uuid').v4();
    const now = new Date().toISOString();
    const task = { id, prompt, model, status: 'pending', createdAt: now };
    this.tasks.push(task);
    return Promise.resolve({ id, status: 'pending', createdAt: now });
  }

  updateTask(id, { status, result, tokensUsed, cost }) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      task.result = result;
      task.tokensUsed = tokensUsed;
      task.cost = cost;
      if (status === 'completed') task.completedAt = new Date().toISOString();
    }
    return Promise.resolve();
  }

  recordTokenUsage(model, tokensUsed, cost) {
    this.tokenUsage.push({ model, tokensUsed, cost, timestamp: new Date().toISOString() });
    return Promise.resolve();
  }

  getSetting(key) {
    return Promise.resolve(this.settings[key] || null);
  }

  setSetting(key, value) {
    this.settings[key] = value;
    return Promise.resolve();
  }

  getTokenStats() {
    const stats = {};
    this.tokenUsage.forEach(entry => {
      if (!stats[entry.model]) {
        stats[entry.model] = { tokens: 0, cost: 0 };
      }
      stats[entry.model].tokens += entry.tokensUsed || 0;
      stats[entry.model].cost += entry.cost || 0;
    });
    Object.keys(stats).forEach(key => {
      stats[key].cost = stats[key].cost.toFixed(2);
    });
    return Promise.resolve(stats);
  }

  getTokenHistory(limit = 100) {
    return Promise.resolve(
      this.tokenUsage
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    );
  }

  getTaskHistory(limit = 50) {
    return Promise.resolve(
      this.tasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
    );
  }

  getActiveTasks() {
    return this.activeTasks.filter(t => t.status === 'pending' || t.status === 'processing');
  }

  addActiveTask(task) {
    this.activeTasks.push(task);
  }

  removeActiveTask(id) {
    this.activeTasks = this.activeTasks.filter(t => t.id !== id);
  }

  close() {
    // No-op for in-memory
  }
}

module.exports = Database;
