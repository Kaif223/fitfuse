-- Fix: allow the RECIPIENT (to_id) to delete follow requests when accepting or declining
-- Previously only the sender (from_id) could delete their own request

CREATE POLICY "recipient can delete request"
  ON follow_requests
  FOR DELETE
  USING (auth.uid() = to_id);
