-- =====================================================
-- CLIENT RESERVATION BOOKING SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Enhanced reservation schema for client booking form and submission
-- Integrates with existing customers and lofts tables
-- Requirements: 5.4, 5.5, 10.1, 10.2

-- =====================================================
-- 1. ENHANCED RESERVATIONS TABLE
-- =====================================================

-- Create comprehensive reservations table with guest information JSONB structure
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key relationships
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    
    -- Reservation dates and duration
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    
    -- Guest information as JSONB for flexibility
    guest_info JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   "primary_guest": {
    --     "first_name": "string",
    --     "last_name": "string", 
    --     "email": "string",
    --     "phone": "string",
    --     "nationality": "string"
    --   },
    --   "additional_guests": [
    --     {
    --       "first_name": "string",
    --       "last_name": "string",
    --       "age_group": "adult|child|infant"
    --     }
    --   ],
    --   "total_guests": number,
    --   "adults": number,
    --   "children": number,
    --   "infants": number
    -- }
    
    -- Pricing breakdown as JSONB
    pricing JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   "base_price": number,
    --   "nights": number,
    --   "nightly_rate": number,
    --   "cleaning_fee": number,
    --   "service_fee": number,
    --   "taxes": number,
    --   "total_amount": number,
    --   "currency": "DZD",
    --   "breakdown": [
    --     {"date": "2024-01-01", "rate": 100.00, "type": "base"},
    --     {"date": "2024-01-02", "rate": 120.00, "type": "weekend"}
    --   ]
    -- }
    
    -- Special requests and preferences
    special_requests TEXT,
    dietary_requirements TEXT,
    accessibility_needs TEXT,
    
    -- Status tracking with audit fields
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'failed')),
    
    -- Confirmation and reference
    confirmation_code VARCHAR(20) UNIQUE,
    booking_reference VARCHAR(50) UNIQUE,
    
    -- Communication preferences
    communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "whatsapp": false}',
    
    -- Terms and conditions acceptance
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    terms_version VARCHAR(10) DEFAULT '1.0',
    
    -- Cancellation information
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES customers(id),
    
    -- Audit fields for tracking (Requirements 10.1, 10.2)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES customers(id),
    updated_by UUID REFERENCES customers(id),
    
    -- Source tracking
    booking_source VARCHAR(50) DEFAULT 'website', -- 'website', 'mobile_app', 'phone', 'email'
    user_agent TEXT,
    ip_address INET,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_guest_count CHECK ((guest_info->>'total_guests')::INTEGER > 0),
    CONSTRAINT valid_pricing CHECK ((pricing->>'total_amount')::DECIMAL >= 0)
);

-- =====================================================
-- 2. RESERVATION AUDIT LOG TABLE
-- =====================================================

-- Comprehensive audit logging for all reservation activities (Requirements 10.1, 10.2)
CREATE TABLE IF NOT EXISTS reservation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'confirmed', 'payment_updated'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- User context
    user_id UUID REFERENCES customers(id),
    user_type VARCHAR(20), -- 'customer', 'admin', 'system'
    session_id VARCHAR(255),
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. RESERVATION COMMUNICATIONS TABLE
-- =====================================================

-- Track all communications related to reservations
CREATE TABLE IF NOT EXISTS reservation_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Communication details
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'booking_confirmation', 'payment_confirmation', 'check_in_instructions',
        'check_out_reminder', 'cancellation_notice', 'modification_notice',
        'customer_inquiry', 'support_response', 'review_request'
    )),
    
    -- Message content
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Sender/recipient information
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'system', 'admin')),
    sender_id UUID REFERENCES customers(id),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    
    -- Delivery tracking
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Template information
    template_id VARCHAR(100),
    template_variables JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. RESERVATION PAYMENTS TABLE
-- =====================================================

-- Track payment information for reservations
CREATE TABLE IF NOT EXISTS reservation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'full_payment', 'balance', 'refund')),
    payment_method VARCHAR(50) NOT NULL, -- 'card', 'bank_transfer', 'cash', 'mobile_payment'
    
    -- Payment processor information
    processor VARCHAR(50), -- 'stripe', 'paypal', 'cib', 'manual'
    transaction_id VARCHAR(255),
    processor_response JSONB,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Refund information
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refunded_by UUID REFERENCES customers(id),
    
    -- Metadata
    notes TEXT,
    receipt_url TEXT
);

-- =====================================================
-- 5. RESERVATION LOCKS TABLE
-- =====================================================

-- Prevent double bookings during reservation process
CREATE TABLE IF NOT EXISTS reservation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    
    -- Lock details
    locked_by UUID REFERENCES customers(id),
    session_id VARCHAR(255) NOT NULL,
    lock_reason VARCHAR(50) DEFAULT 'booking_in_progress',
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_lock_dates CHECK (check_out_date > check_in_date)
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Reservations table indexes
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_loft_id ON reservations(loft_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation_code ON reservations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_booking_reference ON reservations(booking_reference);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- Guest information JSONB indexes for search
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email ON reservations USING GIN ((guest_info->'primary_guest'->>'email'));
CREATE INDEX IF NOT EXISTS idx_reservations_guest_name ON reservations USING GIN ((guest_info->'primary_guest'->>'first_name'), (guest_info->'primary_guest'->>'last_name'));

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_reservation_audit_reservation_id ON reservation_audit_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_audit_action ON reservation_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_reservation_audit_created_at ON reservation_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_reservation_audit_user_id ON reservation_audit_log(user_id);

-- Communications indexes
CREATE INDEX IF NOT EXISTS idx_reservation_communications_reservation_id ON reservation_communications(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_communications_type ON reservation_communications(type);
CREATE INDEX IF NOT EXISTS idx_reservation_communications_status ON reservation_communications(status);
CREATE INDEX IF NOT EXISTS idx_reservation_communications_created_at ON reservation_communications(created_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_status ON reservation_payments(status);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_transaction_id ON reservation_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_created_at ON reservation_payments(created_at);

-- Locks indexes
CREATE INDEX IF NOT EXISTS idx_reservation_locks_loft_dates ON reservation_locks(loft_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservation_locks_expires_at ON reservation_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservation_locks_session_id ON reservation_locks(session_id);

-- =====================================================
-- 7. FUNCTIONS FOR RESERVATION MANAGEMENT
-- =====================================================

-- Function to generate unique confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check FROM reservations WHERE confirmation_code = code;
        
        -- Exit loop if code is unique
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN code;
END;
$ LANGUAGE plpgsql;

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $
DECLARE
    ref TEXT;
    exists_check INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YY');
    
    LOOP
        -- Generate reference like LA24001234
        ref := 'LA' || year_suffix || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
        
        -- Check if reference already exists
        SELECT COUNT(*) INTO exists_check FROM reservations WHERE booking_reference = ref;
        
        -- Exit loop if reference is unique
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN ref;
END;
$ LANGUAGE plpgsql;

-- Function to check availability and create reservation lock
CREATE OR REPLACE FUNCTION create_reservation_lock(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_customer_id UUID,
    p_session_id TEXT
) RETURNS UUID AS $
DECLARE
    lock_id UUID;
    conflict_count INTEGER;
BEGIN
    -- Check for existing reservations
    SELECT COUNT(*) INTO conflict_count
    FROM reservations
    WHERE loft_id = p_loft_id
    AND status IN ('confirmed', 'pending')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Loft not available for selected dates';
    END IF;
    
    -- Check for existing locks (excluding expired ones)
    SELECT COUNT(*) INTO conflict_count
    FROM reservation_locks
    WHERE loft_id = p_loft_id
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in
    AND expires_at > NOW()
    AND session_id != p_session_id;
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Loft is currently being booked by another user';
    END IF;
    
    -- Create or update lock
    INSERT INTO reservation_locks (loft_id, check_in_date, check_out_date, locked_by, session_id)
    VALUES (p_loft_id, p_check_in, p_check_out, p_customer_id, p_session_id)
    ON CONFLICT (loft_id, check_in_date, check_out_date, session_id) 
    DO UPDATE SET expires_at = NOW() + INTERVAL '15 minutes'
    RETURNING id INTO lock_id;
    
    RETURN lock_id;
END;
$ LANGUAGE plpgsql;

-- Function to release reservation lock
CREATE OR REPLACE FUNCTION release_reservation_lock(p_session_id TEXT)
RETURNS VOID AS $
BEGIN
    DELETE FROM reservation_locks 
    WHERE session_id = p_session_id;
END;
$ LANGUAGE plpgsql;

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM reservation_locks 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS FOR AUDIT LOGGING AND DATA CONSISTENCY
-- =====================================================

-- Function to log reservation changes
CREATE OR REPLACE FUNCTION log_reservation_changes()
RETURNS TRIGGER AS $
DECLARE
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_name TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        INSERT INTO reservation_audit_log (
            reservation_id, action, new_values, user_id, user_type
        ) VALUES (
            NEW.id, 'created', to_jsonb(NEW), NEW.created_by, 'customer'
        );
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Identify changed fields
        FOR field_name IN SELECT column_name FROM information_schema.columns 
                         WHERE table_name = 'reservations' AND table_schema = 'public'
        LOOP
            IF to_jsonb(OLD) ->> field_name IS DISTINCT FROM to_jsonb(NEW) ->> field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
        
        -- Log the change
        INSERT INTO reservation_audit_log (
            reservation_id, action, old_values, new_values, changed_fields, user_id, user_type
        ) VALUES (
            NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), changed_fields, NEW.updated_by, 'customer'
        );
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO reservation_audit_log (
            reservation_id, action, old_values, user_id, user_type
        ) VALUES (
            OLD.id, 'deleted', to_jsonb(OLD), OLD.updated_by, 'customer'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER reservation_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_changes();

-- Function to auto-generate codes and update timestamps
CREATE OR REPLACE FUNCTION handle_reservation_defaults()
RETURNS TRIGGER AS $
BEGIN
    -- Generate confirmation code if not provided
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_confirmation_code();
    END IF;
    
    -- Generate booking reference if not provided
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    -- Set terms accepted timestamp if terms are accepted
    IF NEW.terms_accepted = true AND OLD.terms_accepted = false THEN
        NEW.terms_accepted_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create defaults trigger
CREATE TRIGGER reservation_defaults_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION handle_reservation_defaults();

-- Function to update communication timestamps
CREATE OR REPLACE FUNCTION update_communication_timestamps()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at := NOW();
    
    -- Set sent_at when status changes to sent
    IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
        NEW.sent_at := NOW();
    END IF;
    
    -- Set delivered_at when status changes to delivered
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        NEW.delivered_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create communication timestamps trigger
CREATE TRIGGER communication_timestamps_trigger
    BEFORE UPDATE ON reservation_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_timestamps();

-- =====================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_locks ENABLE ROW LEVEL SECURITY;

-- Reservations policies
CREATE POLICY "customers_can_view_own_reservations" ON reservations
    FOR SELECT USING (customer_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "customers_can_create_reservations" ON reservations
    FOR INSERT WITH CHECK (customer_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "customers_can_update_own_reservations" ON reservations
    FOR UPDATE USING (customer_id = auth.uid() OR created_by = auth.uid());

-- Audit log policies (read-only for customers)
CREATE POLICY "customers_can_view_own_audit_log" ON reservation_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND customer_id = auth.uid())
    );

-- Communications policies
CREATE POLICY "customers_can_view_own_communications" ON reservation_communications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND customer_id = auth.uid())
    );

CREATE POLICY "customers_can_create_communications" ON reservation_communications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND customer_id = auth.uid())
    );

-- Payments policies
CREATE POLICY "customers_can_view_own_payments" ON reservation_payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND customer_id = auth.uid())
    );

-- Locks policies (temporary access during booking)
CREATE POLICY "customers_can_manage_own_locks" ON reservation_locks
    FOR ALL USING (locked_by = auth.uid());

-- =====================================================
-- 10. SCHEDULED CLEANUP JOBS
-- =====================================================

-- Note: These would typically be set up as cron jobs or scheduled functions
-- For now, we create the functions that can be called periodically

-- Function to clean up old audit logs (keep 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM reservation_audit_log 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to clean up old communications (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_communications()
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM reservation_communications 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND type NOT IN ('booking_confirmation', 'payment_confirmation');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 11. COMPLETION MESSAGE
-- =====================================================

SELECT 'Client Reservation Booking Schema created successfully! 🎯' as status,
       'Features: Comprehensive reservations, JSONB guest info, Audit logging, Communication tracking, Payment management, Reservation locks' as features,
       'Security: RLS policies, Audit trails, Data validation' as security,
       'Ready for: BookingForm React component and ReservationService backend' as next_steps;