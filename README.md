# FitFuse 👗

> A smart wardrobe & social outfit management app built with **React Native + Expo**.  
> Manage your digital closet, get AI-powered outfit suggestions, share looks with friends, and dress smart for the weather.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Modules](#api-modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Building for Android](#building-for-android)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| � **Digital Closet** | Add, edit, delete clothing items with photos, type, style, color & season tags |
| 🤖 **AI Outfit Scanner** | Point camera at any person — AI detects style and suggests matching items from your wardrobe |
| 🌤️ **Weather Recommendations** | Live weather-based outfit suggestions using your city |
| 📸 **Social Feed** | Share outfit photos with captions, like and comment on posts |
| 👥 **Follow System** | Send/accept/decline follow requests, see follower & following counts |
| � **User Search** | Search other users by name, follow/unfollow directly from results |
| 🔔 **Pending Requests** | View and manage incoming follow requests |
| 🔐 **Secure Auth** | Email/password auth with persistent sessions via Expo SecureStore |
| 🖼️ **Avatar Upload** | Update profile picture stored in Supabase Storage |
- 👥 Follow system

## Tech Stack

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | ~54.0.0 |
| Navigation | Expo Router (file-based) | ~6.0.23 |
| State Management | Redux Toolkit | ^2.3.0 |
| Database & Auth | Supabase (PostgreSQL) | ^2.105.1 |
| Storage | Supabase Storage | — |
| AI Vision | Groq API — Llama 4 Scout Vision | — |
| Weather | OpenWeather API | — |
| Icons | Lucide React Native | ^0.383.0 |
| File System | Expo FileSystem v19 | ~19.0.22 |
| Camera | Expo Camera | ~17.0.10 |
| Image Picker | Expo ImagePicker | ~17.0.11 |
| Secure Storage | Expo SecureStore | ~15.0.8 |
| Language | TypeScript | ~5.9.2 |

---

## Project Structure

```
fitfuse/
├── app/                        # All screens (Expo Router file-based routing)
│   ├── _layout.tsx             # Root layout — auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Login screen
│   │   └── register.tsx        # Register screen
│   └── (tabs)/
│       ├── _layout.tsx         # Bottom tab navigator
│       ├── index.tsx           # Home / weather outfit suggestion
│       ├── feed.tsx            # Social feed (posts, likes, comments)
│       ├── closet.tsx          # Digital wardrobe manager
│       ├── scan.tsx            # AI outfit scanner (camera + Groq)
│       └── profile.tsx         # Profile, stats, search, follow system
│
├── src/
│   ├── api.ts                  # All Supabase + AI + Weather API calls
│   ├── AuthContext.tsx         # Auth state (user, profile, login, logout)
│   ├── supabase.ts             # Supabase client + uploadImage helper
│   ├── theme.ts                # Colors, radii, shared design tokens
│   └── store/
│       ├── store.ts            # Redux store setup
│       ├── feedSlice.ts        # Redux slice for posts feed
│       └── wardrobeSlice.ts    # Redux slice for wardrobe items
│
├── assets/
│   └── fitfuse_logo.png        # App icon (1024×1024 PNG)
│
├── supabase/
│   └── migrations/             # SQL migrations — run in Supabase SQL Editor
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_storage_buckets.sql
│       ├── 004_follow_requests.sql
│       ├── 005_follows_accept_policy.sql
│       └── 006_fix_follow_requests_delete.sql
│
├── app.json                    # Expo app config
├── eas.json                    # EAS Build profiles
├── tsconfig.json
└── .env                        # Local environment variables (git-ignored)
```

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | One row per user — stores `name`, `avatar_url`, `bio`, `city` |
| `posts` | Outfit photos with caption, linked to a profile |
| `likes` | Many-to-many: users ↔ posts (unique per pair) |
| `comments` | Comments on posts |
| `follows` | Directional follow graph: `follower_id` → `following_id` |
| `follow_requests` | Pending requests before a follow is accepted |
| `wardrobe_items` | Clothing items with `type`, `style`, `color`, `season`, `image_url` |

### Wardrobe Item Fields

| Field | Allowed Values |
|---|---|
| `type` | `shirt` · `pants` · `shoes` · `jacket` · `accessory` · `other` |
| `style` | `casual` · `formal` · `sporty` · `traditional` |
| `season` | `all` · `summer` · `winter` · `spring` · `autumn` |

---

## API Modules

All API calls live in `src/api.ts` and are grouped by domain:

| Export | Purpose |
|---|---|
| `feedApi` | Get all posts, get following-only posts, create post, delete post |
| `likesApi` | Get user likes, like a post, unlike a post |
| `commentsApi` | Get comments, add comment, delete comment |
| `followsApi` | Follow, unfollow, check status, get counts, send/accept/decline requests |
| `wardrobeApi` | Get items, add item (with image upload), delete item |
| `profilesApi` | Get profile, get user posts, update profile, search users |
| `recommendApi` | Get weather, suggest outfit by temperature, AI outfit photo analysis |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI — `npm install -g expo-cli`
- EAS CLI — `npm install -g eas-cli`
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free tier)
- An [OpenWeather](https://openweathermap.org/api) API key (free tier)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Kaif223/fitfuse.git
cd fitfuse

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in your API keys

# 4. Start the development server
npm start
```

Scan the QR code with the **Expo Go** app, or press `a` for Android emulator / `i` for iOS simulator.

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key
EXPO_PUBLIC_GROQ_API_KEY=your-groq-api-key
```

### Where to get each key

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | [openweathermap.org/api](https://openweathermap.org/api) — free tier |
| `EXPO_PUBLIC_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free tier |

---

## Supabase Setup

Run the SQL migration files **in order** inside your Supabase **SQL Editor**:

```
001_initial_schema.sql          ← Creates all tables
002_rls_policies.sql            ← Row Level Security policies
003_storage_buckets.sql         ← Storage bucket configuration
004_follow_requests.sql         ← Follow requests table
005_follows_accept_policy.sql   ← RLS policy for accepting follows
006_fix_follow_requests_delete.sql
```

### Storage Buckets

| Bucket | Access | Used For |
|---|---|---|
| `post-images` | Public | Feed post photos |
| `wardrobe-images` | Private (signed URLs, 7-day expiry) | Closet item photos |
| `avatars` | Public | Profile pictures |

---

## Building for Android

The project uses **EAS Build** — Expo's cloud build service. No local Android SDK required.

### Step 1 — Login

```bash
eas login
```

### Step 2 — Preview build (APK — direct install, best for testing)

```bash
eas build --profile preview --platform android
```

### Step 3 — Production build (AAB — for Google Play Store)

```bash
eas build --profile production --platform android
```

### Build Profiles

| Profile | Output | Use Case |
|---|---|---|
| `development` | Dev client | Local development with hot reload |
| `preview` | `.apk` | Share with testers / install directly on device |
| `production` | `.aab` | Submit to Google Play Store |

> Builds run on EAS cloud servers (~5–10 minutes). Download links appear at [expo.dev/builds](https://expo.dev/builds).

---

## License

MIT © [Kaif223](https://github.com/Kaif223)


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
