const express = require('express');
const router = express.Router();
const { db } = require('../firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// GET today's outfit suggestion based on weather
router.post('/today', async (req, res) => {
  try {
    const { userId, city } = req.body;
    if (!userId || !city) return res.status(400).json({ error: 'userId and city required' });

    // 1. Get weather from OpenWeather API
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();

    if (weatherData.cod !== 200) {
      return res.status(400).json({ error: 'Could not fetch weather for ' + city });
    }

    const weather = {
      temp: weatherData.main.temp,
      high: weatherData.main.temp_max,
      low: weatherData.main.temp_min,
      condition: weatherData.weather[0].description,
      city: weatherData.name,
    };

    // 2. Get user's wardrobe from Firestore
    let wardrobeItems = [];
    let stats = { items: 0, outfits: 0 };

    if (db) {
      const snap = await db.collection('wardrobe').where('userId', '==', userId).get();
      wardrobeItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      stats.items = wardrobeItems.length;
    }

    if (wardrobeItems.length === 0) {
      return res.json({ weather, outfit: null, stats });
    }

    // 3. Ask Claude AI to suggest an outfit
    const wardrobeList = wardrobeItems
      .map(i => `- ${i.name} (${i.category}, ${i.color})`)
      .join('\n');

    const prompt = `You are a fashion AI assistant for the app FitFuse.

Current weather: ${weather.temp}°C, ${weather.condition} in ${weather.city}

User's wardrobe:
${wardrobeList}

Based on the weather, suggest the best complete outfit from the wardrobe above.
Respond ONLY with valid JSON in this exact format:
{
  "top": { "name": "exact item name from wardrobe", "color": "color" },
  "bottom": { "name": "exact item name from wardrobe", "color": "color" },
  "shoes": { "name": "exact item name from wardrobe or null if none", "color": "color" },
  "reason": "One short sentence explaining why this outfit suits today's weather"
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    let outfit = null;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      outfit = JSON.parse(clean);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
    }

    res.json({ weather, outfit, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST suggest outfit from a photo
router.post('/from-photo', async (req, res) => {
  try {
    const { userId, image } = req.body;
    if (!userId || !image) return res.status(400).json({ error: 'userId and image required' });

    // Get user's wardrobe
    let wardrobeItems = [];
    if (db) {
      const snap = await db.collection('wardrobe').where('userId', '==', userId).get();
      wardrobeItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const wardrobeList = wardrobeItems.length > 0
      ? wardrobeItems.map(i => `- ${i.name} (${i.category}, ${i.color})`).join('\n')
      : 'No items in wardrobe yet';

    // Send image to Gemini Vision
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const imagePart = {
      inlineData: { data: image, mimeType: 'image/jpeg' },
    };
    const textPart = `You are a fashion AI assistant for FitFuse app.

Analyze the outfit in this photo. Then, from the user's wardrobe below, suggest matching items.

User's wardrobe:
${wardrobeList}

Respond ONLY with valid JSON in this exact format:
{
  "analysis": "Brief description of the style/aesthetic in the photo (1-2 sentences)",
  "matches": [
    {
      "type": "Top/Bottom/Shoes/Outerwear",
      "name": "exact item name from wardrobe",
      "category": "category",
      "color": "color",
      "reason": "Why this item matches the style in the photo"
    }
  ]
}

If wardrobe has no matching items, return an empty matches array.`;

    const response = await visionModel.generateContent([textPart, imagePart]);
    const text = response.response.text().trim();

    let result = null;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch (e) {
      result = { analysis: text, matches: [] };
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
