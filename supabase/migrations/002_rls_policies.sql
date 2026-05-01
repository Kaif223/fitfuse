-- ============================================================
-- FitFuse — Supabase Migration 002: Row Level Security (RLS)
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
-- Anyone can read any profile (public app)
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT USING (true);

-- Only the owner can update their own profile
CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- POSTS
-- ============================================================
-- Anyone can read posts
CREATE POLICY "posts: public read"
  ON public.posts FOR SELECT USING (true);

-- Only logged-in users can create posts (their own)
CREATE POLICY "posts: auth insert"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the post owner can delete their post
CREATE POLICY "posts: owner delete"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- LIKES
-- ============================================================
-- Anyone can see likes
CREATE POLICY "likes: public read"
  ON public.likes FOR SELECT USING (true);

-- Logged-in user can like (insert their own like)
CREATE POLICY "likes: auth insert"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can only remove their own like
CREATE POLICY "likes: owner delete"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
-- Anyone can read comments
CREATE POLICY "comments: public read"
  ON public.comments FOR SELECT USING (true);

-- Logged-in user can add a comment
CREATE POLICY "comments: auth insert"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only comment owner can delete their comment
CREATE POLICY "comments: owner delete"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
-- Anyone can see follows (so you can show follower count)
CREATE POLICY "follows: public read"
  ON public.follows FOR SELECT USING (true);

-- Logged-in user can follow someone (they must be the follower)
CREATE POLICY "follows: auth insert"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- User can only unfollow themselves (delete their own follow row)
CREATE POLICY "follows: owner delete"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================
-- WARDROBE ITEMS
-- ============================================================
-- Only the owner can read their wardrobe
CREATE POLICY "wardrobe: owner read"
  ON public.wardrobe_items FOR SELECT
  USING (auth.uid() = user_id);

-- Only owner can add items
CREATE POLICY "wardrobe: owner insert"
  ON public.wardrobe_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owner can update items
CREATE POLICY "wardrobe: owner update"
  ON public.wardrobe_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owner can delete items
CREATE POLICY "wardrobe: owner delete"
  ON public.wardrobe_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- OUTFITS
-- ============================================================
-- Only the owner can read their outfits
CREATE POLICY "outfits: owner read"
  ON public.outfits FOR SELECT
  USING (auth.uid() = user_id);

-- Only owner can save outfits
CREATE POLICY "outfits: owner insert"
  ON public.outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owner can delete outfits
CREATE POLICY "outfits: owner delete"
  ON public.outfits FOR DELETE
  USING (auth.uid() = user_id);
