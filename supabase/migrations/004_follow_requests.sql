-- Follow requests table
CREATE TABLE IF NOT EXISTS follow_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (from_id, to_id)
);

-- RLS
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can send a request
CREATE POLICY "send request" ON follow_requests
  FOR INSERT WITH CHECK (auth.uid() = from_id);

-- Sender can cancel their own request
CREATE POLICY "cancel request" ON follow_requests
  FOR DELETE USING (auth.uid() = from_id);

-- Recipient can update (accept/decline) requests sent to them
CREATE POLICY "respond to request" ON follow_requests
  FOR UPDATE USING (auth.uid() = to_id);

-- Both parties can read requests involving them
CREATE POLICY "read own requests" ON follow_requests
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);
