const express = require('express');
const router = express.Router();
const { db, storage } = require('../firebase-admin');

// GET all wardrobe items for a user
router.get('/:userId', async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snap = await db.collection('wardrobe').where('userId', '==', req.params.userId).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new clothing item
router.post('/add', async (req, res) => {
  try {
    const { userId, name, category, color, imageBase64 } = req.body;
    if (!userId || !name || !category) return res.status(400).json({ error: 'Missing required fields' });

    // Store image as base64 directly in Firestore (no Storage needed)
    let imageUrl = '';
    if (imageBase64) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    if (!db) return res.status(503).json({ error: 'Firebase not configured' });

    const docRef = await db.collection('wardrobe').add({
      userId, name, category, color, imageUrl,
      wornCount: 0,
      createdAt: new Date().toISOString(),
    });

    res.json({ id: docRef.id, message: 'Item added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a wardrobe item
router.delete('/:itemId', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Firebase not configured' });
    await db.collection('wardrobe').doc(req.params.itemId).delete();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
