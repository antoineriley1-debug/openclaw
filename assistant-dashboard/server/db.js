const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new sqlite3.Database(path.join(dbDir, 'assistant.db'));
    this.activeTasks = [];
  }

  init() {
    this.db.serialize(() => {
      // Tasks table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          prompt TEXT,
          model TEXT,
          status TEXT DEFAULT 'pending',
          createdAt TEXT,
          completedAt TEXT,
          result TEXT,
          tokensUsed INTEGER,
          cost REAL
        )
      `);

      // Token usage table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS token_usage (
          id TEXT PRIMARY KEY,
          model TEXT,
          tokensUsed INTEGER,
          cost REAL,
          timestamp TEXT
        )
      `);

      // Settings table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          encrypted BOOLEAN DEFAULT 0
        )
      `);

      // API Keys (encrypted)
      this.db.run(`
        INSERT OR IGNORE INTO settings (key, value, encrypted)
        VALUES
          ('api_key_anthropic', '', 1),
          ('api_key_ollama_url', '', 1),
          ('api_key_mistral', '', 1),
          ('api_key_groq', '', 1),
          ('router_strategy', 'smart', 0),
          ('auto_select_model', '1', 0),
          ('theme', 'dark', 0)
      `);
    });
  }

  createTask(prompt, model = 'auto') {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();
      
      this.db.run(
        `INSERT INTO tasks (id, prompt, model, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
        [id, prompt, model, 'pending', now],
        (err) => {
          if (err) reject(err);
          else resolve({ id, status: 'pending', createdAt: now });
        }
      );
    });
  }

  updateTask(id, { status, result, tokensUsed, cost }) {
    return new Promise((resolve, reject) => {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      
      this.db.run(
        `UPDATE tasks SET status = ?, result = ?, tokensUsed = ?, cost = ?, completedAt = ? WHERE id = ?`,
        [status, result, tokensUsed, cost, completedAt, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  recordTokenUsage(model, tokensUsed, cost) {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();
      
      this.db.run(
        `INSERT INTO token_usage (id, model, tokensUsed, cost, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [id, model, tokensUsed, cost, now],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.value : null);
      });
    });
  }

  setSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getTokenStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT model, SUM(tokensUsed) as totalTokens, SUM(cost) as totalCost FROM token_usage GROUP BY model`,
        (err, rows) => {
          if (err) reject(err);
          else {
            const stats = {};
            rows.forEach(row => {
              stats[row.model] = {
                tokens: row.totalTokens || 0,
                cost: (row.totalCost || 0).toFixed(2),
              };
            });
            resolve(stats);
          }
        }
      );
    });
  }

  getTokenHistory(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT model, tokensUsed, cost, timestamp FROM token_usage ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getTaskHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, prompt, model, status, createdAt, completedAt, tokensUsed, cost FROM tasks ORDER BY createdAt DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
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
    this.db.close();
  }
}

module.exports = Database;
