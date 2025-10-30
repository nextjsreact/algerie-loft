-- =====================================================
-- RESERVATION LOCKS TABLE SCHEMA
-- =====================================================
-- Table for managing temporary reservation locks to prevent double bookings

-- Create reservation_locks table
CREATE TABLE IF NOT EXISTS reservation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_dates_valid CHECK (check_out > check_in),
    CONSTRAINT check_expires_future CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservation_locks_loft_dates 
ON reservation_locks(loft_id, check_in, check_out);

CREATE INDEX IF NOT EXISTS idx_reservation_locks_expires_at 
ON reservation_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_reservation_locks_user_id 
ON reservation_locks(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE reservation_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own locks" ON reservation_locks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create locks" ON reservation_locks
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own locks" ON reservation_locks
    FOR DELETE USING (auth.uid() = user_id);

-- Admin policy for full access
CREATE POLICY "Admins have full access to reservation locks" ON reservation_locks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Function to automatically clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_reservation_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM reservation_locks 
    WHERE expires_at < NOW();
END;
$$;

-- Create a scheduled job to run cleanup every 5 minutes (if pg_cron is available)
-- This is optional and depends on the pg_cron extension being installed
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_reservation_locks();');

COMMENT ON TABLE reservation_locks IS 'Temporary locks to prevent double bookings during reservation process';
COMMENT ON COLUMN reservation_locks.expires_at IS 'Lock expiration time, typically 15 minutes from creation';
COMMENT ON FUNCTION cleanup_expired_reservation_locks() IS 'Removes expired reservation locks to keep table clean';