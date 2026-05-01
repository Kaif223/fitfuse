# Phase 1 — Supabase Setup Guide

## Step 1: Create Your Supabase Project

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name:** `fitfuse`
   - **Database Password:** (save this somewhere safe)
   - **Region:** pick the closest to you (e.g. `eu-central-1` for Pakistan)
4. Wait ~2 minutes for the project to be ready

---

## Step 2: Run the SQL Migrations (in order)

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy & paste the content of each file below **one at a time**, in order:

| Order | File | What it does |
|-------|------|--------------|
| 1st   | `supabase/migrations/001_initial_schema.sql` | Creates all 7 tables + auto-profile trigger + helper view |
| 2nd   | `supabase/migrations/002_rls_policies.sql`   | Enables Row Level Security on all tables |
| 3rd   | `supabase/migrations/003_storage_buckets.sql`| Creates 3 storage buckets + their access policies |

> ✅ After each one, click **"Run"** and confirm you see "Success"

---

## Step 3: Get Your Supabase Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** → looks like `https://xxxxxxxxxxx.supabase.co`
   - **anon/public key** → a long JWT string

---

## Step 4: Create the Frontend `.env` File

Create a file called `.env` in the root of your app
(next to `package.json`) with this content:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key-here
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

> ⚠️ Replace the Supabase values with YOUR project's values from Step 3.
> The weather + Gemini keys are copied from your existing backend `.env`.

---

## Step 5: Verify the Tables Were Created

In the Supabase dashboard, go to **Table Editor** and confirm you see:
- ✅ `profiles`
- ✅ `posts`
- ✅ `likes`
- ✅ `comments`
- ✅ `follows`
- ✅ `wardrobe_items`
- ✅ `outfits`

And in **Storage**, confirm you see 3 buckets:
- ✅ `post-images` (public)
- ✅ `wardrobe-images` (private)
- ✅ `avatars` (public)

---

## ✅ Phase 1 Complete Checklist

- [ ] Supabase project created
- [ ] All 3 SQL migration files ran successfully
- [ ] Supabase URL + anon key copied
- [ ] Frontend `.env` file created with keys
- [ ] 7 tables visible in Table Editor
- [ ] 3 storage buckets visible in Storage

---

Once all boxes are checked, let me know and we move to **Phase 2**:
> Removing Firebase packages + Installing Supabase SDK
