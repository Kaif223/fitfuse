const express = require('express');
const router = express.Router();
const { db } = require('../firebase-admin');

// GET all feed posts
router.get('/', async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(50).get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST like/unlike a post
router.post('/:postId/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!db) return res.status(503).json({ error: 'Firebase not configured' });
    const postRef = db.collection('posts').doc(req.params.postId);
    const post = await postRef.get();
    if (!post.exists) return res.status(404).json({ error: 'Post not found' });
    const likes = post.data().likes || [];
    const alreadyLiked = likes.includes(userId);
    await postRef.update({
      likes: alreadyLiked
        ? likes.filter((id) => id !== userId)
        : [...likes, userId],
    });
    res.json({ liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
