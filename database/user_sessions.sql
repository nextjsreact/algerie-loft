DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_seen ON user_sessions(last_seen);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all sessions" ON user_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can see own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS cleanup_expired_sessions();
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions WHERE last_seen < now() - interval '2 minutes';
END;
$$;

DROP FUNCTION IF EXISTS upsert_user_session(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION upsert_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_device_info TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_sessions (user_id, session_id, device_info, ip_address, last_seen)
  VALUES (p_user_id, p_session_id, p_device_info, p_ip_address, now())
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET
    last_seen = now(),
    device_info = EXCLUDED.device_info,
    ip_address = EXCLUDED.ip_address;
END;
$$;
