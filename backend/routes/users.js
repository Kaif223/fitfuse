const express = require('express');
const router = express.Router();
const { db } = require('../firebase-admin');

// GET search users by name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!db || !q) return res.json([]);
    const snap = await db.collection('users').get();
    const users = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.name?.toLowerCase().includes(q.toLowerCase()))
      .map(u => ({ id: u.id, name: u.name, email: u.email })); // never expose sensitive data
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send friend request
router.post('/request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!db) return res.status(503).json({ error: 'Firebase not configured' });
    await db.collection('friendRequests').add({
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
