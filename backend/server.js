const express = require('express');
const cors = require('cors');
require('dotenv').config();

const outfitRoutes = require('./routes/outfit');
const wardrobeRoutes = require('./routes/wardrobe');
const feedRoutes = require('./routes/feed');
const usersRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for base64 images

app.use('/api/outfit', outfitRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', usersRoutes);

app.get('/health', (req, res) => res.json({ status: 'FitFuse backend running ✅' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 FitFuse backend running on port ${PORT}`));
