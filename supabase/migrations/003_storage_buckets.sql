-- ============================================================
-- FitFuse — Supabase Migration 003: Storage Buckets
-- Run this AFTER 002_rls_policies.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. POST IMAGES bucket
--    Public: anyone can view post images
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. WARDROBE IMAGES bucket
--    Private: only the owner can view
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-images', 'wardrobe-images', false)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. AVATAR IMAGES bucket
--    Public: anyone can view profile avatars
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- ── post-images ──────────────────────────────
-- Anyone can view post images (public bucket)
CREATE POLICY "post-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Only logged-in users can upload post images
-- File path must start with their user id: "userId/filename.jpg"
CREATE POLICY "post-images: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only the uploader can delete their post image
CREATE POLICY "post-images: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── wardrobe-images ───────────────────────────
-- Only the owner can view their wardrobe images
CREATE POLICY "wardrobe-images: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'wardrobe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only owner can upload wardrobe images
CREATE POLICY "wardrobe-images: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wardrobe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only owner can delete wardrobe images
CREATE POLICY "wardrobe-images: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wardrobe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── avatars ───────────────────────────────────
-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Only logged-in users can upload their own avatar
CREATE POLICY "avatars: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only owner can update avatar
CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
