# FitFuse 👗

A smart wardrobe and social outfit app built with **React Native + Expo**. Catalogue your clothes, get outfit suggestions based on live weather, scan an outfit photo for AI-matched suggestions from your own closet, and share looks with the people you follow.

> **Architecture note:** FitFuse is a **serverless / backend-less app**. The Expo client talks directly to Supabase (Postgres + Auth + Storage), with row-level security enforcing access control. The `backend/` folder is **legacy code from an earlier Firebase-based version and is not used or wired up** — see [Backend folder status](#backend-folder--status-not-in-use).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Database Schema](#database-schema)
- [API Modules](#api-modules)
- [Backend folder — status (not in use)](#backend-folder--status-not-in-use)
- [Known Issues & Cleanup](#known-issues--cleanup)
- [Building for Android](#building-for-android)
- [License](#license)

---

## Features

| Screen | Feature |
|---|---|
| **Today** | Greeting + live weather for your city, plus an outfit picked from your closet by temperature band. Also shows your pending follow requests with accept/decline. |
| **Closet** | Add, browse, filter and delete clothing items with a photo, type, style, colour and season tag. |
| **Scan** | Take or pick a photo → Groq vision model detects whether a person is present, reads the outfit's style/occasion, and suggests a matching shirt / pants / shoes **from your own wardrobe**, weighted by current weather. |
| **Feed** | Post outfit photos with captions, like and comment. Toggle between *For You* (everyone) and *Following*. Search users inline. |
| **Profile** | Edit name / city / bio, upload an avatar, see wardrobe + follower + following counts, view your own posts, search and follow other users. |
| **Auth** | Email + password sign up / login via Supabase Auth. A Postgres trigger auto-creates the profile row on signup. |

### How the two suggestion engines differ

There are **two separate** outfit engines, and only one uses AI:

- **Today tab** — [`recommendApi.suggestOutfit()`](src/api.ts#L413). Pure local logic, **no AI call**. It reads the temperature and picks random season-matching items:

  | Temperature | Preferred season tag |
  |---|---|
  | `< 12°C` | `winter` |
  | `12–19°C` | `autumn` |
  | `20–25°C` | `spring` |
  | `≥ 26°C` | `summer` |

  This is instant, free and never fails — but it only matches items whose `season` tag matches exactly, so a slot is left empty if you have no item for that season.

- **Scan tab** — [`recommendApi.analyzeOutfitPhoto()`](src/api.ts#L464). Sends the photo + your wardrobe list to **Groq** (`meta-llama/llama-4-scout-17b-16e-instruct`) and asks for a strict JSON response. Weather is injected into the prompt when your profile has a city set.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | ~54.0.0 |
| Navigation | Expo Router (file-based) | ~6.0.23 |
| State | Redux Toolkit + React Redux | ^2.3.0 / ^9.1.2 |
| Database / Auth | Supabase (PostgreSQL) | ^2.105.1 |
| File storage | Supabase Storage | — |
| AI vision | Groq — Llama 4 Scout 17B | — |
| Weather | OpenWeather API | — |
| Icons | Lucide React Native | ^0.383.0 |
| Camera / Picker | expo-camera, expo-image-picker | ~17.0.x |
| Filesystem | expo-file-system (v19 `File`/`Paths` API) | ~19.0.22 |
| Language | TypeScript | ~5.9.2 |

---

## Architecture

```
┌─────────────────────────────┐
│   Expo app (React Native)   │
│                             │
│  app/      screens (router) │
│  src/api.ts  all API calls  │
│  src/store  Redux slices    │
└───┬─────────┬───────────┬───┘
    │         │           │
    │         │           └──────────► Groq API      (scan → outfit match)
    │         └──────────────────────► OpenWeather   (city → temp/condition)
    │
    └────────────────────────────────► Supabase
                                        ├─ Auth      (email + password)
                                        ├─ Postgres  (7 tables + 1 view, RLS on)
                                        └─ Storage   (3 buckets)
```

**There is no server of our own.** Security is enforced by Postgres Row Level Security policies, not by application code. Every third-party key in the app is an `EXPO_PUBLIC_*` variable, which means it is bundled into the client — see [Known Issues](#known-issues--cleanup).

---

## Project Structure

```
fitfuse/
├── app/                        # Screens — Expo Router file-based routing
│   ├── _layout.tsx             # Root layout: Redux + Auth providers, auth gate/redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/
│       ├── _layout.tsx         # Bottom tab bar (5 tabs)
│       ├── index.tsx           # Today — weather + outfit + follow requests
│       ├── closet.tsx          # Wardrobe manager
│       ├── scan.tsx            # AI outfit scanner (camera + Groq)
│       ├── feed.tsx            # Social feed
│       └── profile.tsx         # Profile, stats, user search, follows
│
├── src/
│   ├── api.ts                  # All Supabase / Groq / OpenWeather calls
│   ├── AuthContext.tsx         # user, session, profile, login/register/logout
│   ├── supabase.ts             # Supabase client + uploadImage / getPublicUrl helpers
│   ├── theme.ts                # colors, radius, spacing tokens
│   └── store/
│       ├── store.ts            # Redux store + typed hooks
│       ├── wardrobeSlice.ts    # fetch / add / delete wardrobe items
│       └── feedSlice.ts        # fetch posts, optimistic likes
│
├── supabase/migrations/        # SQL — run in order in the Supabase SQL Editor
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_storage_buckets.sql
│   ├── 004_follow_requests.sql
│   ├── 005_follows_accept_policy.sql
│   └── 006_fix_follow_requests_delete.sql
│
├── backend/                    # ⚠️ LEGACY — not used by the app, see below
├── assets/fitfuse_logo.png
├── app.json                    # Expo config (permissions, plugins, EAS project id)
├── eas.json                    # EAS Build profiles
└── .env                        # Local secrets — git-ignored
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free tier)
- An [OpenWeather](https://openweathermap.org/api) API key (free tier)
- Expo Go on your phone, or an Android emulator / iOS simulator

### Install & run

```bash
git clone https://github.com/Kaif223/fitfuse.git
cd fitfuse

npm install

cp .env.example .env      # then fill in your four keys

npm start                 # or: npm run android / npm run ios
```

Scan the QR code with **Expo Go**, or press `a` / `i` in the terminal.

> Run the [Supabase migrations](#supabase-setup) **before** first launch, otherwise login will succeed but every query will fail.

---

## Environment Variables

Create `.env` in the project root (copy from `.env.example`):

```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key
EXPO_PUBLIC_GROQ_API_KEY=your-groq-api-key
```

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | [openweathermap.org/api](https://openweathermap.org/api) — free tier |
| `EXPO_PUBLIC_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free tier |

Restart the Expo dev server after editing `.env` — `EXPO_PUBLIC_*` values are inlined at bundle time.

---

## Supabase Setup

Run the migration files **in order** in the Supabase **SQL Editor**:

| File | Creates |
|---|---|
| `001_initial_schema.sql` | All tables, indexes, the `handle_new_user` signup trigger, and the `posts_with_details` view |
| `002_rls_policies.sql` | Row Level Security policies for every table |
| `003_storage_buckets.sql` | The three storage buckets + their RLS policies |
| `004_follow_requests.sql` | `follow_requests` table + policies |
| `005_follows_accept_policy.sql` | Insert policy so a recipient can accept a request |
| `006_fix_follow_requests_delete.sql` | Delete policy fix for the recipient |

### Storage buckets

| Bucket | Public? | Used for |
|---|---|---|
| `post-images` | Public | Feed post photos |
| `wardrobe-images` | **Private** | Closet photos — served via 1-hour signed URLs, re-minted on every fetch |
| `avatars` | Public | Profile pictures |

> The wardrobe bucket stores the **storage path** in the DB, never a signed URL (those expire). [`wardrobeApi.getItems()`](src/api.ts) batch-signs the paths on each read and also recovers paths from legacy rows that stored a full URL.

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user: `name`, `avatar_url`, `bio`, `city` (defaults to `Faisalabad`). Auto-created by trigger on signup. |
| `posts` | Outfit photos with caption, owned by a profile |
| `likes` | user ↔ post, `UNIQUE(post_id, user_id)` |
| `comments` | Comments on posts |
| `follows` | `follower_id` → `following_id`, unique pair, self-follow blocked by CHECK |
| `follow_requests` | Pending request before a follow is created |
| `wardrobe_items` | Clothing items |
| `outfits` | Saved outfit combos — **table exists but is currently unused by the app** |
| `posts_with_details` *(view)* | `posts` joined with author profile + like/comment counts — what the feed actually reads |

### Wardrobe item fields

| Field | Allowed values |
|---|---|
| `type` | `shirt` · `pants` · `shoes` · `jacket` · `accessory` · `other` |
| `style` | `casual` · `formal` · `sporty` · `traditional` |
| `season` | `all` · `summer` · `winter` · `spring` · `autumn` |

---

## API Modules

Everything lives in [src/api.ts](src/api.ts), grouped by domain:

| Export | Methods |
|---|---|
| `feedApi` | `getPosts`, `getFollowingPosts`, `createPost`, `deletePost` |
| `likesApi` | `getUserLikes`, `like`, `unlike` |
| `commentsApi` | `getComments`, `addComment`, `deleteComment` |
| `followsApi` | `follow`, `unfollow`, `isFollowing`, `getFollowerCount`, `getFollowingCount`, `sendRequest`, `cancelRequest`, `acceptRequest`, `declineRequest`, `hasPendingRequest`, `getPendingRequests` |
| `wardrobeApi` | `getItems`, `addItem`, `deleteItem` |
| `profilesApi` | `getProfile`, `getUserPosts`, `updateProfile`, `searchUsers` |
| `recommendApi` | `getWeather`, `suggestOutfit` (local), `analyzeOutfitPhoto` (Groq) |

---

## Backend folder — status: NOT IN USE

`backend/` is a leftover Express + Firebase + Gemini server from an earlier version of this project, before it was migrated to Supabase. **It is dead code.** The app does not import it, call it, or depend on it in any way, and deleting the folder would not change app behaviour.

### Verified findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **Nothing calls it.** No `API_URL`, no `localhost:3001`, no fetch to any `/api/*` route anywhere in `app/` or `src/`. | `grep -rn "localhost:3001\|/api/" app src` → no matches |
| 2 | **It cannot start.** Dependencies were never installed; there is no `backend/node_modules`. | `node server.js` → `Error: Cannot find module 'express'` |
| 3 | **Wrong stack.** Backend is Firebase/Firestore + Google Gemini; the app is Supabase/Postgres + Groq. Two unrelated data layers. | `routes/*.js` use `db.collection(...)`; `src/api.ts` uses `supabase.from(...)` |
| 4 | **Config drift.** `backend/.env.example` documents `CLAUDE_API_KEY` and `package.json` depends on `@anthropic-ai/sdk`, but the code actually reads `process.env.GEMINI_API_KEY` and imports `@google/generative-ai`. Following the example file produces a non-working config. | [backend/routes/outfit.js:4-7](backend/routes/outfit.js#L4-L7) vs [backend/.env.example](backend/.env.example) |
| 5 | **Incompatible schema.** Backend expects Firestore `wardrobe` docs with `name`/`category`/`color`/`wornCount` and `posts` with a `likes` **array**. The app uses `wardrobe_items` with `type`/`style`/`season` and a separate `likes` **table**. | `routes/wardrobe.js`, `routes/feed.js` |
| 6 | **No authentication on any route.** Every endpoint trusts a `userId` sent in the request body or URL. `firebase-admin` is imported but no ID token is ever verified — so if this were deployed as-is, anyone could read, add or delete any user's wardrobe items. | `routes/wardrobe.js`, `routes/users.js`, `routes/feed.js` |
| 7 | **Failures are silent.** `firebase-admin.js` catches init errors and sets `db = null`; routes then return `[]` or `503` instead of surfacing the real problem. | [backend/firebase-admin.js:17-24](backend/firebase-admin.js#L17-L24) |
| 8 | Syntax itself is valid — `node --check` passes on all six files. The folder is stale, not corrupt. | — |

### What to do about it

Pick one — the first is recommended for a clean submission:

1. **Delete it.** `git rm -r backend/ SETUP.md` — nothing in the app breaks. The project is intentionally backend-less.
2. **Keep it as documented history.** Leave it in place; this README already marks it as unused.
3. **Revive it** (only if a server is genuinely required — e.g. to stop shipping API keys to the client). That means: rewriting the routes against Supabase instead of Firestore, adding real token verification, and pointing `src/api.ts` at it. This is a rewrite, not a fix.

> ⚠️ **Security:** `backend/serviceAccountKey.json` contains a **live Firebase private key**, and `backend/.env` holds real API keys. Both are correctly listed in `.gitignore`, and `git log --all` confirms neither was ever committed. Still — since the backend is unused, **revoke that service-account key** in the Firebase Console rather than leaving it sitting on disk.

`SETUP.md` in the repo root is from the same era. It tells you to configure Firebase and edit `src/firebase.ts` — **a file that does not exist**. Ignore it; this README supersedes it.

---

## Known Issues & Cleanup

Honest list of things worth knowing before you build on this:

| Issue | Detail |
|---|---|
| **Sessions do not persist across restarts** | [src/supabase.ts:8-14](src/supabase.ts#L8-L14) defines `ExpoSecureStoreAdapter`, but it is backed by an in-memory `Map` — not SecureStore. `expo-secure-store` is installed and configured in `app.json` but never actually used for the session. Users are logged out every time the app is killed. Swapping the `Map` for real `SecureStore` calls fixes it. |
| **API keys ship inside the app bundle** | All keys are `EXPO_PUBLIC_*`, so the Groq and OpenWeather keys are extractable from a distributed APK. Acceptable for a university project with free-tier keys; not acceptable for a public release. Fixing it properly means a real server or Supabase Edge Functions. |
| **`outfits` table is unused** | Created in migration 001, no code reads or writes it. |
| **Stray files in the repo root** | `item.id}` (empty, 0 bytes — an accidental shell redirect), `write_feed.py`, `write_screens.py`, `fix_profile.sh`, `install_redux.sh`. The scripts are one-off code generators that hardcode an old `/home/kaif/Downloads/fitfuse-complete` path and no longer apply. Safe to delete. |
| **`SETUP.md` is stale** | Describes the abandoned Firebase architecture. See the backend section above. |
| **Today tab can show empty slots** | `suggestOutfit` requires an exact `season` tag match, so a slot stays blank if you own nothing tagged for the current season — even if an `all`-season item would fit. |

---

## Building for Android

Uses **EAS Build** (Expo's cloud builder) — no local Android SDK needed.

```bash
npm install -g eas-cli
eas login

# APK for testers / direct install
eas build --profile preview --platform android

# AAB for Google Play
eas build --profile production --platform android
```

| Profile | Output | Use |
|---|---|---|
| `development` | Dev client | Local development with hot reload |
| `preview` | `.apk` | Share with testers, install directly |
| `production` | `.aab` | Google Play submission |

Builds take roughly 5–10 minutes; download links appear at [expo.dev/builds](https://expo.dev/builds).

---

## License

MIT © [Kaif223](https://github.com/Kaif223)
