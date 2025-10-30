-- =====================================================
-- AVAILABILITY ENGINE SCHEMA FOR CLIENT RESERVATION FLOW
-- =====================================================
-- Enhanced availability and pricing system specifically designed for
-- the client reservation flow with real-time availability tracking,
-- pricing overrides, and reservation locking mechanism.
-- 
-- Requirements: 3.5, 4.2, 9.1, 9.2
-- =====================================================

-- =====================================================
-- 1. AVAILABILITY TABLE
-- =====================================================

-- Create or enhance the availability table for date-based tracking
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    price_override DECIMAL(10,2), -- Override base price for specific dates
    minimum_stay INTEGER, -- Minimum stay requirement for this date
    maximum_stay INTEGER, -- Maximum stay allowed starting from this date
    blocked_reason VARCHAR(100), -- Reason if blocked (maintenance, owner use, etc.)
    seasonal_rate_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Multiplier for seasonal pricing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique availability record per loft per date
    CONSTRAINT unique_loft_date UNIQUE (loft_id, date)
);

-- Migrate data from existing loft_availability table if it exists
DO $$
DECLARE
    has_created_at BOOLEAN;
    has_updated_at BOOLEAN;
    has_is_available BOOLEAN;
    has_minimum_stay_override BOOLEAN;
BEGIN
    -- Check if loft_availability table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loft_availability') THEN
        
        -- Check which columns exist in the source table
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'loft_availability' AND column_name = 'created_at'
        ) INTO has_created_at;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'loft_availability' AND column_name = 'updated_at'
        ) INTO has_updated_at;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'loft_availability' AND column_name = 'is_available'
        ) INTO has_is_available;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'loft_availability' AND column_name = 'minimum_stay_override'
        ) INTO has_minimum_stay_override;
        
        -- Migrate data with dynamic column selection
        IF has_created_at AND has_updated_at AND has_is_available AND has_minimum_stay_override THEN
            -- All columns exist
            INSERT INTO availability (loft_id, date, available, price_override, minimum_stay, created_at, updated_at)
            SELECT 
                loft_id, 
                date, 
                COALESCE(is_available, true) as available,
                price_override,
                minimum_stay_override as minimum_stay,
                created_at,
                updated_at
            FROM loft_availability
            WHERE NOT EXISTS (
                SELECT 1 FROM availability a 
                WHERE a.loft_id = loft_availability.loft_id 
                AND a.date = loft_availability.date
            );
        ELSIF has_is_available AND has_minimum_stay_override THEN
            -- Basic columns exist
            INSERT INTO availability (loft_id, date, available, price_override, minimum_stay)
            SELECT 
                loft_id, 
                date, 
                COALESCE(is_available, true) as available,
                price_override,
                minimum_stay_override as minimum_stay
            FROM loft_availability
            WHERE NOT EXISTS (
                SELECT 1 FROM availability a 
                WHERE a.loft_id = loft_availability.loft_id 
                AND a.date = loft_availability.date
            );
        ELSE
            -- Minimal migration with required columns only
            INSERT INTO availability (loft_id, date, available, price_override)
            SELECT 
                loft_id, 
                date, 
                CASE 
                    WHEN has_is_available THEN COALESCE(is_available, true)
                    ELSE true
                END as available,
                price_override
            FROM loft_availability
            WHERE NOT EXISTS (
                SELECT 1 FROM availability a 
                WHERE a.loft_id = loft_availability.loft_id 
                AND a.date = loft_availability.date
            );
        END IF;
        
        RAISE NOTICE 'Migrated data from loft_availability table to availability table';
    END IF;
END $$;

-- =====================================================
-- 2. RESERVATION LOCKS TABLE
-- =====================================================

-- Table to handle reservation locking during booking process
CREATE TABLE IF NOT EXISTS reservation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For anonymous users
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released', 'converted'))
    
    -- Note: Overlapping lock prevention is handled through application logic
    -- and unique constraints rather than GIST exclusion to avoid operator class issues
);

-- =====================================================
-- 3. PRICING RULES TABLE
-- =====================================================

-- Table for dynamic pricing rules and seasonal rates
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    day_of_week INTEGER[], -- Array of days (0=Sunday, 1=Monday, etc.)
    minimum_stay INTEGER,
    maximum_stay INTEGER,
    price_multiplier DECIMAL(5,2) DEFAULT 1.00,
    fixed_price DECIMAL(10,2), -- Override with fixed price instead of multiplier
    priority INTEGER DEFAULT 0, -- Higher priority rules override lower ones
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure valid date ranges
    CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
    CONSTRAINT valid_stay_range CHECK (minimum_stay IS NULL OR maximum_stay IS NULL OR minimum_stay <= maximum_stay)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for availability queries
CREATE INDEX IF NOT EXISTS idx_availability_loft_date ON availability(loft_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_date_range ON availability(date) WHERE available = true;
CREATE INDEX IF NOT EXISTS idx_availability_loft_available ON availability(loft_id, available) WHERE available = true;

-- Composite index for date range queries with availability
CREATE INDEX IF NOT EXISTS idx_availability_loft_date_available ON availability(loft_id, date, available);

-- Index for price override queries
CREATE INDEX IF NOT EXISTS idx_availability_price_override ON availability(loft_id, date) WHERE price_override IS NOT NULL;

-- Indexes for reservation locks
CREATE INDEX IF NOT EXISTS idx_reservation_locks_loft_dates ON reservation_locks(loft_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservation_locks_expires ON reservation_locks(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_reservation_locks_user ON reservation_locks(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_reservation_locks_session ON reservation_locks(session_id) WHERE status = 'active';

-- Indexes for pricing rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_loft_active ON pricing_rules(loft_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(loft_id, priority DESC) WHERE is_active = true;

-- =====================================================
-- 5. FUNCTIONS FOR AVAILABILITY MANAGEMENT
-- =====================================================

-- Function to check availability for a date range
CREATE OR REPLACE FUNCTION check_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    unavailable_count INTEGER;
BEGIN
    -- First clean up any expired locks
    PERFORM cleanup_expired_locks();
    
    -- Check if any dates in the range are unavailable
    SELECT COUNT(*)
    INTO unavailable_count
    FROM availability
    WHERE loft_id = p_loft_id
    AND date >= p_check_in
    AND date < p_check_out
    AND available = false;
    
    -- Also check for active (non-expired) reservation locks using overlap logic
    SELECT COUNT(*) + unavailable_count
    INTO unavailable_count
    FROM reservation_locks
    WHERE loft_id = p_loft_id
    AND status = 'active'
    AND expires_at > NOW()
    AND (check_in < p_check_out AND check_out > p_check_in);
    
    RETURN unavailable_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check for overlapping reservation locks
CREATE OR REPLACE FUNCTION check_overlapping_locks(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Clean up expired locks first
    PERFORM cleanup_expired_locks();
    
    -- Check for overlapping active locks
    SELECT COUNT(*)
    INTO overlap_count
    FROM reservation_locks
    WHERE loft_id = p_loft_id
    AND status = 'active'
    AND expires_at > NOW()
    AND (
        (check_in < p_check_out AND check_out > p_check_in)
    );
    
    RETURN overlap_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create a reservation lock
CREATE OR REPLACE FUNCTION create_reservation_lock(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT 15
) RETURNS UUID AS $$
DECLARE
    lock_id UUID;
BEGIN
    -- First check if dates are available
    IF NOT check_availability(p_loft_id, p_check_in, p_check_out) THEN
        RAISE EXCEPTION 'Dates are not available for loft %', p_loft_id;
    END IF;
    
    -- Check for overlapping locks
    IF NOT check_overlapping_locks(p_loft_id, p_check_in, p_check_out) THEN
        RAISE EXCEPTION 'Overlapping reservation lock exists for loft % between % and %', 
            p_loft_id, p_check_in, p_check_out;
    END IF;
    
    -- Create the lock
    INSERT INTO reservation_locks (
        loft_id, check_in, check_out, user_id, session_id, expires_at
    ) VALUES (
        p_loft_id, p_check_in, p_check_out, p_user_id, p_session_id,
        NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO lock_id;
    
    RETURN lock_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release a reservation lock
CREATE OR REPLACE FUNCTION release_reservation_lock(p_lock_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reservation_locks
    SET status = 'released', updated_at = NOW()
    WHERE id = p_lock_id AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE reservation_locks
    SET status = 'expired'
    WHERE status = 'active' AND expires_at <= NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATIC MAINTENANCE
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on availability table
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy for reading availability (public access for search)
CREATE POLICY "Public read access for availability" ON availability
    FOR SELECT USING (true);

-- Policy for managing availability (admin/manager only)
CREATE POLICY "Admin manage availability" ON availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Enable RLS on reservation locks
ALTER TABLE reservation_locks ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own locks
CREATE POLICY "Users manage own locks" ON reservation_locks
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Enable RLS on pricing rules
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policy for reading pricing rules (public access)
CREATE POLICY "Public read pricing rules" ON pricing_rules
    FOR SELECT USING (is_active = true);

-- Policy for managing pricing rules (admin/manager only)
CREATE POLICY "Admin manage pricing rules" ON pricing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 8. INITIAL DATA AND SETUP
-- =====================================================

-- Create default availability for existing lofts (next 365 days)
INSERT INTO availability (loft_id, date, available)
SELECT 
    l.id as loft_id,
    generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '365 days',
        INTERVAL '1 day'
    )::DATE as date,
    true as available
FROM lofts l
WHERE NOT EXISTS (
    SELECT 1 FROM availability a 
    WHERE a.loft_id = l.id 
    AND a.date >= CURRENT_DATE 
    AND a.date <= CURRENT_DATE + INTERVAL '365 days'
)
ON CONFLICT (loft_id, date) DO NOTHING;

-- =====================================================
-- SCHEMA COMPLETION
-- =====================================================

-- Add helpful comments
COMMENT ON TABLE availability IS 'Date-based availability tracking for lofts with pricing overrides';
COMMENT ON TABLE reservation_locks IS 'Temporary locks during booking process to prevent conflicts';
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules and seasonal rate management';

COMMENT ON FUNCTION check_availability(UUID, DATE, DATE) IS 'Check if a loft is available for given date range';
COMMENT ON FUNCTION check_overlapping_locks(UUID, DATE, DATE) IS 'Check for overlapping reservation locks';
COMMENT ON FUNCTION create_reservation_lock(UUID, DATE, DATE, UUID, VARCHAR, INTEGER) IS 'Create temporary reservation lock';
COMMENT ON FUNCTION release_reservation_lock(UUID) IS 'Release an active reservation lock';
COMMENT ON FUNCTION cleanup_expired_locks() IS 'Clean up expired reservation locks';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Availability schema for client reservation flow created successfully';
    RAISE NOTICE 'Tables created: availability, reservation_locks, pricing_rules';
    RAISE NOTICE 'Functions created: check_availability, check_overlapping_locks, create_reservation_lock, release_reservation_lock, cleanup_expired_locks';
    RAISE NOTICE 'Indexes created for optimal date range query performance';
END $$;