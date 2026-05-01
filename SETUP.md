# FitFuse — Complete Setup Guide
## For 8th Semester FYP — React Native + Node.js + Firebase + Claude AI

---

## STEP 1 — Get Your Free API Keys (10 minutes)

### A. Claude API Key (AI outfit suggestions)
1. Go to https://console.anthropic.com
2. Sign up with your email
3. Click "API Keys" in the left menu
4. Click "Create Key" → Copy the key
5. You get free credits when you sign up ✅

### B. OpenWeather API Key (weather data)
1. Go to https://openweathermap.org/api
2. Click "Sign Up" (free)
3. After login, go to "My API Keys"
4. Your key is already there — copy it ✅

### C. Firebase Setup (database + storage + auth)
1. Go to https://console.firebase.google.com
2. Click "Create a project" → Name it "fitfuse" → Continue
3. Disable Google Analytics → Create Project
4. In left menu: **Authentication** → Get Started → Email/Password → Enable → Save
5. In left menu: **Firestore Database** → Create Database → Start in test mode → Choose region → Done
6. In left menu: **Storage** → Get Started → Start in test mode → Done
7. In left menu: **Project Settings** (gear icon) → Your Apps → Click </> (Web)
8. Register app with name "fitfuse" → Copy the firebaseConfig object
9. Still in Project Settings → **Service Accounts** tab → "Generate new private key" → Download JSON file

---

## STEP 2 — Setup Frontend

```bash
# 1. Open terminal in the fitfuse folder (the one with package.json)
cd fitfuse

# 2. Install dependencies
npm install

# 3. Open src/firebase.ts and paste your Firebase config
# Replace all the YOUR_... values with the config you copied
```

---

## STEP 3 — Setup Backend

```bash
# 1. Open a new terminal, go to backend folder
cd fitfuse/backend

# 2. Install dependencies
npm install

# 3. Create your .env file
# On Windows: copy .env.example .env
# On Mac/Linux: cp .env.example .env

# 4. Open .env and fill in:
# CLAUDE_API_KEY=your_key_from_step_1A
# OPENWEATHER_API_KEY=your_key_from_step_1B
# FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# 5. Copy the serviceAccountKey.json you downloaded from Firebase
# Paste it inside the backend/ folder (same folder as server.js)
```

---

## STEP 4 — Run The App

You need TWO terminals open at the same time:

### Terminal 1 — Backend
```bash
cd fitfuse/backend
npm run dev
# You should see: 🚀 FitFuse backend running on port 3001
# And: ✅ Firebase Admin connected
```

### Terminal 2 — Frontend
```bash
cd fitfuse
npm start
# Expo will show a QR code
```

### On Your Phone
1. Install "Expo Go" from App Store / Play Store
2. Scan the QR code
3. App will open on your phone!

---

## STEP 5 — Test Everything

1. **Register** a new account in the app
2. **Add clothes** to your closet (tap the + button on Closet tab)
3. Go to **Today tab** — it should show weather and AI outfit suggestion
4. Go to **Scan tab** — pick a photo from gallery to get AI suggestions
5. Go to **Feed tab** — post your first outfit

---

## Testing on Phone vs Computer

When testing on your phone (Expo Go), change the API_URL in `src/api.ts`:
```
// Find your computer's IP address:
// Windows: run "ipconfig" in cmd → look for IPv4 Address
// Mac: System Preferences → Network

// Change this line in src/api.ts:
export const API_URL = 'http://192.168.1.XXX:3001'; // your computer's IP
```

---

## Common Problems

**"Cannot connect to backend"**
→ Make sure backend terminal is running (npm run dev)
→ Check API_URL in src/api.ts matches your computer's IP

**"Firebase not configured"**
→ Double check src/firebase.ts has your correct config values
→ Make sure serviceAccountKey.json is in backend/ folder

**"Weather not loading"**
→ Check OPENWEATHER_API_KEY in backend/.env
→ New OpenWeather keys take up to 2 hours to activate

**"AI outfit not working"**
→ Check CLAUDE_API_KEY in backend/.env
→ Make sure you have credits at console.anthropic.com

---

## Project Structure

```
fitfuse/
├── app/
│   ├── _layout.tsx          ← Root layout with auth
│   ├── (auth)/
│   │   ├── login.tsx        ← Login screen
│   │   └── register.tsx     ← Register screen
│   └── (tabs)/
│       ├── index.tsx        ← Today / Dashboard
│       ├── closet.tsx       ← Digital wardrobe
│       ├── scan.tsx         ← AI photo scanner
│       └── feed.tsx         ← Community feed
├── src/
│   ├── firebase.ts          ← Firebase config
│   ├── AuthContext.tsx      ← Login state management
│   ├── api.ts               ← Backend API calls
│   └── theme.ts             ← Colors and styles
└── backend/
    ├── server.js            ← Express server
    ├── firebase-admin.js    ← Firebase admin
    ├── routes/
    │   ├── outfit.js        ← AI outfit + weather
    │   ├── wardrobe.js      ← Wardrobe CRUD
    │   ├── feed.js          ← Community posts
    │   └── users.js         ← Friends system
    ├── .env.example         ← Copy to .env
    └── serviceAccountKey.json ← Download from Firebase (gitignored)
```
