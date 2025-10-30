-- =====================================================
-- PRODUCTION DATABASE DEPLOYMENT SCRIPT
-- =====================================================
-- Complete production-ready database schema for Client Reservation Flow
-- This script combines all necessary tables, indexes, and optimizations
-- Requirements: 9.1, 9.2, 9.5
-- =====================================================

-- =====================================================
-- 1. PRODUCTION ENVIRONMENT SETUP
-- =====================================================

-- Set production-specific configurations
SET statement_timeout = '30s';
SET lock_timeout = '10s';
SET idle_in_transaction_session_timeout = '60s';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 2. CORE TABLES (from complete-schema.sql)
-- =====================================================

-- Custom types
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loft_status') THEN
        CREATE TYPE loft_status AS ENUM ('available', 'occupied', 'maintenance');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loft_ownership') THEN
        CREATE TYPE loft_ownership AS ENUM ('company', 'third_party');
    END IF;
END$;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zone areas for geographical organization
CREATE TABLE IF NOT EXISTS zone_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loft owners
CREATE TABLE IF NOT EXISTS loft_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    ownership_type loft_ownership NOT NULL DEFAULT 'third_party',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lofts table with enhanced fields for reservations
CREATE TABLE IF NOT EXISTS lofts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price_per_night NUMERIC NOT NULL DEFAULT 0,
    price_per_month NUMERIC NOT NULL DEFAULT 0,
    status loft_status NOT NULL DEFAULT 'available',
    owner_id UUID REFERENCES loft_owners(id) ON DELETE CASCADE,
    company_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    owner_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    zone_area_id UUID REFERENCES zone_areas(id) ON DELETE SET NULL,
    
    -- Reservation-specific fields
    max_guests INTEGER DEFAULT 2,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    amenities TEXT[] DEFAULT '{}',
    house_rules TEXT,
    cancellation_policy TEXT DEFAULT 'moderate',
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER DEFAULT 30,
    
    -- Pricing fields
    cleaning_fee NUMERIC DEFAULT 0,
    service_fee_percentage NUMERIC DEFAULT 10.0,
    tax_rate NUMERIC DEFAULT 19.0,
    
    -- Location data for search
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Algeria',
    
    -- Availability settings
    advance_booking_days INTEGER DEFAULT 365,
    instant_booking BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_percentage_split CHECK ((company_percentage + owner_percentage) = 100.00),
    CONSTRAINT valid_guest_count CHECK (max_guests > 0),
    CONSTRAINT valid_stay_limits CHECK (maximum_stay >= minimum_stay)
);

-- =====================================================
-- 3. CUSTOMERS TABLE (from customers_table.sql)
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Authentication integration
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status and preferences
    status VARCHAR(20) DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'former')),
    language_preference VARCHAR(10) DEFAULT 'fr',
    currency_preference VARCHAR(10) DEFAULT 'DZD',
    
    -- Profile information
    date_of_birth DATE,
    nationality VARCHAR(100),
    address TEXT,
    emergency_contact JSONB,
    
    -- Preferences for reservations
    preferences JSONB DEFAULT '{}',
    -- Structure: {
    --   "notifications": {"email": true, "sms": false},
    --   "dietary_requirements": "string",
    --   "accessibility_needs": "string"
    -- }
    
    -- Notes and relationship
    notes TEXT,
    current_loft_id UUID REFERENCES lofts(id),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 4. LOFT PHOTOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loft_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. AVAILABILITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    price_override NUMERIC,
    minimum_stay_override INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(loft_id, date)
);

-- =====================================================
-- 6. RESERVATION SYSTEM TABLES (from client-reservation-booking-schema.sql)
-- =====================================================

-- Enhanced reservations table
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
    
    -- Pricing breakdown as JSONB
    pricing JSONB NOT NULL DEFAULT '{}',
    
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
    
    -- Audit fields for tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES customers(id),
    updated_by UUID REFERENCES customers(id),
    
    -- Source tracking
    booking_source VARCHAR(50) DEFAULT 'website',
    user_agent TEXT,
    ip_address INET,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_guest_count CHECK ((guest_info->>'total_guests')::INTEGER > 0),
    CONSTRAINT valid_pricing CHECK ((pricing->>'total_amount')::DECIMAL >= 0)
);

-- Reservation audit log table
CREATE TABLE IF NOT EXISTS reservation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- User context
    user_id UUID REFERENCES customers(id),
    user_type VARCHAR(20),
    session_id VARCHAR(255),
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservation communications table
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

-- Reservation payments table
CREATE TABLE IF NOT EXISTS reservation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'full_payment', 'balance', 'refund')),
    payment_method VARCHAR(50) NOT NULL,
    
    -- Payment processor information
    processor VARCHAR(50),
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

-- Reservation locks table
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
-- 7. PRODUCTION-OPTIMIZED INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Lofts indexes for search and performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_status ON lofts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_price_per_night ON lofts(price_per_night);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_max_guests ON lofts(max_guests);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_location ON lofts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_city ON lofts(city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_amenities ON lofts USING GIN(amenities);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lofts_instant_booking ON lofts(instant_booking);

-- Customers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Loft photos indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loft_photos_loft_id ON loft_photos(loft_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loft_photos_order ON loft_photos(loft_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loft_photos_primary ON loft_photos(loft_id, is_primary) WHERE is_primary = true;

-- Availability indexes for fast date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_loft_date ON availability(loft_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_date_range ON availability(date, loft_id) WHERE available = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_loft_available ON availability(loft_id, available, date);

-- Reservations indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_loft_id ON reservations(loft_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_loft_dates ON reservations(loft_id, check_in_date, check_out_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_confirmation_code ON reservations(confirmation_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_booking_reference ON reservations(booking_reference);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- JSONB indexes for guest information search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_guest_email ON reservations USING GIN ((guest_info->'primary_guest'->>'email'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_guest_name ON reservations USING GIN ((guest_info->'primary_guest'->>'first_name'), (guest_info->'primary_guest'->>'last_name'));

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_audit_reservation_id ON reservation_audit_log(reservation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_audit_action ON reservation_audit_log(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_audit_created_at ON reservation_audit_log(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_audit_user_id ON reservation_audit_log(user_id);

-- Communications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_communications_reservation_id ON reservation_communications(reservation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_communications_type ON reservation_communications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_communications_status ON reservation_communications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_communications_created_at ON reservation_communications(created_at);

-- Payments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_payments_status ON reservation_payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_payments_transaction_id ON reservation_payments(transaction_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_payments_created_at ON reservation_payments(created_at);

-- Locks indexes for conflict detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_locks_loft_dates ON reservation_locks(loft_id, check_in_date, check_out_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_locks_expires_at ON reservation_locks(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_locks_session_id ON reservation_locks(session_id);

-- =====================================================
-- 8. PRODUCTION FUNCTIONS AND PROCEDURES
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

-- Function to check loft availability for date range
CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $
DECLARE
    conflict_count INTEGER;
    unavailable_days INTEGER;
BEGIN
    -- Check for existing confirmed reservations
    SELECT COUNT(*) INTO conflict_count
    FROM reservations
    WHERE loft_id = p_loft_id
    AND status IN ('confirmed', 'pending')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;
    
    IF conflict_count > 0 THEN
        RETURN false;
    END IF;
    
    -- Check availability calendar for blocked dates
    SELECT COUNT(*) INTO unavailable_days
    FROM availability
    WHERE loft_id = p_loft_id
    AND date >= p_check_in
    AND date < p_check_out
    AND available = false;
    
    IF unavailable_days > 0 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$ LANGUAGE plpgsql;

-- Function to create reservation lock with conflict detection
CREATE OR REPLACE FUNCTION create_reservation_lock(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_customer_id UUID,
    p_session_id TEXT
) RETURNS UUID AS $
DECLARE
    lock_id UUID;
    is_available BOOLEAN;
    conflict_count INTEGER;
BEGIN
    -- Check availability first
    SELECT check_loft_availability(p_loft_id, p_check_in, p_check_out) INTO is_available;
    
    IF NOT is_available THEN
        RAISE EXCEPTION 'Loft not available for selected dates';
    END IF;
    
    -- Check for existing locks (excluding expired ones and same session)
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

-- Function to calculate pricing for a reservation
CREATE OR REPLACE FUNCTION calculate_reservation_pricing(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_guests INTEGER DEFAULT 2
) RETURNS JSONB AS $
DECLARE
    loft_record RECORD;
    nights INTEGER;
    base_total DECIMAL(10,2);
    cleaning_fee DECIMAL(10,2);
    service_fee DECIMAL(10,2);
    taxes DECIMAL(10,2);
    total_amount DECIMAL(10,2);
    pricing_breakdown JSONB;
BEGIN
    -- Get loft information
    SELECT price_per_night, cleaning_fee, service_fee_percentage, tax_rate, max_guests
    INTO loft_record
    FROM lofts
    WHERE id = p_loft_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loft not found';
    END IF;
    
    -- Validate guest count
    IF p_guests > loft_record.max_guests THEN
        RAISE EXCEPTION 'Guest count exceeds maximum allowed for this loft';
    END IF;
    
    -- Calculate nights
    nights := p_check_out - p_check_in;
    
    IF nights <= 0 THEN
        RAISE EXCEPTION 'Invalid date range';
    END IF;
    
    -- Calculate pricing components
    base_total := loft_record.price_per_night * nights;
    cleaning_fee := COALESCE(loft_record.cleaning_fee, 0);
    service_fee := (base_total + cleaning_fee) * (loft_record.service_fee_percentage / 100);
    taxes := (base_total + cleaning_fee + service_fee) * (loft_record.tax_rate / 100);
    total_amount := base_total + cleaning_fee + service_fee + taxes;
    
    -- Build pricing breakdown
    pricing_breakdown := jsonb_build_object(
        'base_price', base_total,
        'nights', nights,
        'nightly_rate', loft_record.price_per_night,
        'cleaning_fee', cleaning_fee,
        'service_fee', service_fee,
        'service_fee_percentage', loft_record.service_fee_percentage,
        'taxes', taxes,
        'tax_rate', loft_record.tax_rate,
        'total_amount', total_amount,
        'currency', 'DZD',
        'guests', p_guests
    );
    
    RETURN pricing_breakdown;
END;
$ LANGUAGE plpgsql;

-- Function to clean up expired locks (for scheduled execution)
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
-- 9. PRODUCTION TRIGGERS
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
DROP TRIGGER IF EXISTS reservation_audit_trigger ON reservations;
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
    IF NEW.terms_accepted = true AND (OLD IS NULL OR OLD.terms_accepted = false) THEN
        NEW.terms_accepted_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create defaults trigger
DROP TRIGGER IF EXISTS reservation_defaults_trigger ON reservations;
CREATE TRIGGER reservation_defaults_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION handle_reservation_defaults();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create update triggers for timestamp management
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lofts_updated_at ON lofts;
CREATE TRIGGER update_lofts_updated_at 
    BEFORE UPDATE ON lofts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_updated_at ON availability;
CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_locks ENABLE ROW LEVEL SECURITY;

-- Production-ready policies with proper security

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Lofts policies (public read access for search)
DROP POLICY IF EXISTS "Public can view available lofts" ON lofts;
CREATE POLICY "Public can view available lofts" ON lofts
    FOR SELECT USING (status = 'available');

DROP POLICY IF EXISTS "Authenticated users can view all lofts" ON lofts;
CREATE POLICY "Authenticated users can view all lofts" ON lofts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Customers policies
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
CREATE POLICY "Users can view own customer record" ON customers
    FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
CREATE POLICY "Users can update own customer record" ON customers
    FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create customer record" ON customers;
CREATE POLICY "Users can create customer record" ON customers
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Loft photos policies (public read for available lofts)
DROP POLICY IF EXISTS "Public can view loft photos" ON loft_photos;
CREATE POLICY "Public can view loft photos" ON loft_photos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM lofts WHERE id = loft_id AND status = 'available')
    );

-- Availability policies (public read for search)
DROP POLICY IF EXISTS "Public can view availability" ON availability;
CREATE POLICY "Public can view availability" ON availability
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM lofts WHERE id = loft_id AND status = 'available')
    );

-- Reservations policies
DROP POLICY IF EXISTS "Customers can view own reservations" ON reservations;
CREATE POLICY "Customers can view own reservations" ON reservations
    FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can create reservations" ON reservations;
CREATE POLICY "Customers can create reservations" ON reservations
    FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can update own reservations" ON reservations;
CREATE POLICY "Customers can update own reservations" ON reservations
    FOR UPDATE USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- Audit log policies (read-only for customers)
DROP POLICY IF EXISTS "Customers can view own audit log" ON reservation_audit_log;
CREATE POLICY "Customers can view own audit log" ON reservation_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations r 
            JOIN customers c ON r.customer_id = c.id 
            WHERE r.id = reservation_id AND c.auth_user_id = auth.uid()
        )
    );

-- Communications policies
DROP POLICY IF EXISTS "Customers can view own communications" ON reservation_communications;
CREATE POLICY "Customers can view own communications" ON reservation_communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations r 
            JOIN customers c ON r.customer_id = c.id 
            WHERE r.id = reservation_id AND c.auth_user_id = auth.uid()
        )
    );

-- Payments policies
DROP POLICY IF EXISTS "Customers can view own payments" ON reservation_payments;
CREATE POLICY "Customers can view own payments" ON reservation_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations r 
            JOIN customers c ON r.customer_id = c.id 
            WHERE r.id = reservation_id AND c.auth_user_id = auth.uid()
        )
    );

-- Locks policies (temporary access during booking)
DROP POLICY IF EXISTS "Customers can manage own locks" ON reservation_locks;
CREATE POLICY "Customers can manage own locks" ON reservation_locks
    FOR ALL USING (locked_by IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- =====================================================
-- 11. PRODUCTION SEED DATA
-- =====================================================

-- Seed zone areas
INSERT INTO zone_areas (name, description) VALUES 
('Algiers Center', 'Central Algiers area'),
('Hydra', 'Upscale residential area'),
('Bab Ezzouar', 'Business district'),
('Oran Center', 'Central Oran area'),
('Constantine Center', 'Central Constantine area')
ON CONFLICT (name) DO NOTHING;

-- Seed loft owners
INSERT INTO loft_owners (name, email, phone, ownership_type) VALUES
('Loft Algerie', 'contact@loftalgerie.com', '+213-21-123-456', 'company'),
('Premium Properties', 'info@premium-dz.com', '+213-21-234-567', 'third_party')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. PRODUCTION MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs(retention_months INTEGER DEFAULT 24)
RETURNS INTEGER AS $
DECLARE
    archived_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (retention_months || ' months')::INTERVAL;
    
    -- Move old records to archive table (create if not exists)
    CREATE TABLE IF NOT EXISTS reservation_audit_log_archive (LIKE reservation_audit_log INCLUDING ALL);
    
    WITH archived_records AS (
        DELETE FROM reservation_audit_log 
        WHERE created_at < cutoff_date
        RETURNING *
    )
    INSERT INTO reservation_audit_log_archive 
    SELECT * FROM archived_records;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- Procedure to clean up old reservation locks
CREATE OR REPLACE FUNCTION cleanup_old_reservation_locks()
RETURNS INTEGER AS $
DECLARE
    cleaned_count INTEGER;
BEGIN
    DELETE FROM reservation_locks 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN cleaned_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 13. PERFORMANCE MONITORING VIEWS
-- =====================================================

-- View for reservation performance metrics
CREATE OR REPLACE VIEW reservation_metrics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_reservations,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_reservations,
    AVG((pricing->>'total_amount')::DECIMAL) as avg_booking_value,
    SUM((pricing->>'total_amount')::DECIMAL) FILTER (WHERE status = 'confirmed') as total_revenue
FROM reservations
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View for loft performance metrics
CREATE OR REPLACE VIEW loft_performance AS
SELECT 
    l.id,
    l.name,
    l.price_per_night,
    COUNT(r.id) as total_bookings,
    COUNT(r.id) FILTER (WHERE r.status = 'confirmed') as confirmed_bookings,
    AVG((r.pricing->>'total_amount')::DECIMAL) FILTER (WHERE r.status = 'confirmed') as avg_booking_value,
    SUM((r.pricing->>'total_amount')::DECIMAL) FILTER (WHERE r.status = 'confirmed') as total_revenue,
    ROUND(
        COUNT(r.id) FILTER (WHERE r.status = 'confirmed')::DECIMAL / 
        NULLIF(COUNT(r.id), 0) * 100, 2
    ) as confirmation_rate
FROM lofts l
LEFT JOIN reservations r ON l.id = r.loft_id 
    AND r.created_at >= NOW() - INTERVAL '90 days'
GROUP BY l.id, l.name, l.price_per_night
ORDER BY total_revenue DESC NULLS LAST;

-- =====================================================
-- 14. COMPLETION AND VERIFICATION
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Verify schema deployment
DO $
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'lofts', 'customers', 'reservations', 'availability');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';
    
    RAISE NOTICE 'Production schema deployment completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Functions created: %', function_count;
    
    IF table_count < 5 THEN
        RAISE EXCEPTION 'Schema deployment incomplete - missing core tables';
    END IF;
END;
$;

SELECT 'Production Database Schema Deployment Complete! 🚀' as status,
       'Ready for: Application deployment, monitoring setup, backup configuration' as next_steps;