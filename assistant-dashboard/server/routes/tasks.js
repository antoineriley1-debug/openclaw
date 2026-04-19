const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Get all active tasks
  router.get('/', (req, res) => {
    const tasks = db.getActiveTasks();
    res.json({ tasks });
  });

  // Get specific task
  router.get('/:id', async (req, res) => {
    try {
      const task = db.activeTasks.find(t => t.id === req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
