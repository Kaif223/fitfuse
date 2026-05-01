-- ============================================================
-- FitFuse — Supabase Migration 001: Initial Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
--    One row per auth user. Created on signup.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  bio         TEXT,
  city        TEXT DEFAULT 'Faisalabad',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. POSTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. LIKES
--    Unique per user+post (no duplicate likes)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─────────────────────────────────────────────
-- 4. COMMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. FOLLOWS
--    follower_id follows following_id
--    Unique pair (no duplicate follows)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id <> following_id)
);

-- ─────────────────────────────────────────────
-- 6. WARDROBE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'other',   -- shirt | pants | shoes | jacket | accessory | other
  style       TEXT NOT NULL DEFAULT 'casual',  -- casual | formal | sporty | traditional
  color       TEXT NOT NULL DEFAULT '',
  season      TEXT DEFAULT 'all',              -- summer | winter | spring | autumn | all
  worn_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. OUTFITS
--    AI-generated or manually saved outfit combos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outfits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_ids     UUID[] NOT NULL DEFAULT '{}',   -- array of wardrobe_items.id
  event_type   TEXT DEFAULT 'casual',          -- university | party | interview | gym | casual
  weather      TEXT DEFAULT '',                -- e.g. "sunny 28°C"
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (for fast queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id        ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at     ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id        ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id        ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id     ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower     ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following    ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_user_id     ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id      ON public.outfits(user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- This trigger runs every time a new user signs up via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- HELPER VIEW: posts with like count and author profile
-- Use this in your feed query instead of raw posts table
-- ============================================================
CREATE OR REPLACE VIEW public.posts_with_details AS
SELECT
  p.id,
  p.user_id,
  p.image_url,
  p.caption,
  p.created_at,
  pr.name          AS user_name,
  pr.avatar_url    AS user_avatar,
  COUNT(l.id)::INT AS like_count,
  COUNT(c.id)::INT AS comment_count
FROM public.posts p
JOIN public.profiles pr ON pr.id = p.user_id
LEFT JOIN public.likes l ON l.post_id = p.id
LEFT JOIN public.comments c ON c.post_id = p.id
GROUP BY p.id, pr.name, pr.avatar_url;
