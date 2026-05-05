# FitFuse 👗

A smart wardrobe & outfit management app built with React Native + Expo.

## Features
- 👕 Digital wardrobe management
- 🤖 AI-powered outfit suggestions
- 📸 Clothing scanner
- 🌤️ Weather-based outfit recommendations
- 📱 Social feed & outfit sharing
- 👥 Follow system

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo |
| Navigation | Expo Router |
| State Management | Redux Toolkit |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Groq API (Llama 4 Scout Vision) |
| Weather | OpenWeather API |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account

### Installation

```bash
# Clone the repo
git clone https://github.com/Kaif223/fitfuse.git
cd fitfuse

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your API keys in .env

# Start the app
npm start
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys
node server.js
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-key
EXPO_PUBLIC_GROQ_API_KEY=your-groq-key
```

## Project Structure

```
fitfuse/
├── app/              # Expo Router screens
│   ├── (auth)/       # Login, Register
│   └── (tabs)/       # Main app tabs
├── src/              # API, Auth, Store
│   └── store/        # Redux slices
├── backend/          # Node.js server
│   └── routes/       # API routes
└── supabase/         # DB migrations
```

## License
MIT
