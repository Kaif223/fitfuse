-- Fix: allow the recipient (following_id) to insert a follow row when accepting a request
-- This is needed because the acceptor is `toId` = following_id, not follower_id

CREATE POLICY "follows: accept request insert"
  ON public.follows FOR INSERT
  WITH CHECK (
    auth.uid() = following_id
    AND EXISTS (
      SELECT 1 FROM follow_requests
      WHERE from_id = follower_id
        AND to_id   = following_id
    )
  );
