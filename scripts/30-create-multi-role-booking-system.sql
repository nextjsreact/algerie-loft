-- Multi-Role Booking System Database Schema
-- This script extends the existing schema to support client and partner roles with booking functionality

-- Extend user_role enum to include client and partner
DO $$ 
BEGIN
    -- Check if the enum already has the new values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'client' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'client';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'partner' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'partner';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'executive' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'executive';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guest' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'guest';
    END IF;
END $$;

-- Create partner profiles table for business information
CREATE TABLE IF NOT EXISTS partner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    business_type TEXT CHECK (business_type IN ('individual', 'company')) DEFAULT 'individual',
    tax_id TEXT,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents TEXT[] DEFAULT '{}',
    bank_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create booking status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
END $$;

-- Create payment status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
    END IF;
END $$;

-- Create bookings table for reservation management
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    special_requests TEXT,
    booking_reference TEXT UNIQUE,
    payment_intent_id TEXT, -- For Stripe or other payment processors
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure check_out is after check_in
    CONSTRAINT valid_date_range CHECK (check_out > check_in),
    -- Ensure booking is for future dates (can be disabled for testing)
    CONSTRAINT future_booking CHECK (check_in >= CURRENT_DATE)
);

-- Create loft availability table for calendar management
CREATE TABLE IF NOT EXISTS loft_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price_override DECIMAL(10,2) CHECK (price_override >= 0),
    minimum_stay INTEGER DEFAULT 1 CHECK (minimum_stay > 0),
    maximum_stay INTEGER CHECK (maximum_stay IS NULL OR maximum_stay >= minimum_stay),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries for same loft and date
    UNIQUE(loft_id, date)
);

-- Create booking messages table for client-partner communication
CREATE TABLE IF NOT EXISTS booking_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loft reviews table for client feedback
CREATE TABLE IF NOT EXISTS loft_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_published BOOLEAN DEFAULT true,
    response_text TEXT, -- Partner response to review
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per booking
    UNIQUE(booking_id)
);

-- Create booking fees table for additional charges
CREATE TABLE IF NOT EXISTS booking_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('cleaning', 'service', 'tax', 'deposit', 'other')),
    fee_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_refundable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_verification_status ON partner_profiles(verification_status);

CREATE INDEX IF NOT EXISTS idx_bookings_loft_id ON bookings(loft_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

CREATE INDEX IF NOT EXISTS idx_loft_availability_loft_date ON loft_availability(loft_id, date);
CREATE INDEX IF NOT EXISTS idx_loft_availability_date ON loft_availability(date);
CREATE INDEX IF NOT EXISTS idx_loft_availability_available ON loft_availability(is_available);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender_id ON booking_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_created_at ON booking_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_loft_reviews_loft_id ON loft_reviews(loft_id);
CREATE INDEX IF NOT EXISTS idx_loft_reviews_client_id ON loft_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_loft_reviews_published ON loft_reviews(is_published);

CREATE INDEX IF NOT EXISTS idx_booking_fees_booking_id ON booking_fees(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_fees_type ON booking_fees(fee_type);

-- Add trigger to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_booking_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_reference();

-- Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partner_profiles_updated_at
    BEFORE UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_loft_availability_updated_at
    BEFORE UPDATE ON loft_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_booking_messages_updated_at
    BEFORE UPDATE ON booking_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_loft_reviews_updated_at
    BEFORE UPDATE ON loft_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some useful functions for booking management

-- Function to check loft availability for a date range
CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    unavailable_count INTEGER;
    existing_booking_count INTEGER;
BEGIN
    -- Check if any dates in the range are marked as unavailable
    SELECT COUNT(*)
    INTO unavailable_count
    FROM loft_availability
    WHERE loft_id = p_loft_id
    AND date >= p_check_in
    AND date < p_check_out
    AND is_available = false;
    
    -- Check if there are any existing confirmed bookings that overlap
    SELECT COUNT(*)
    INTO existing_booking_count
    FROM bookings
    WHERE loft_id = p_loft_id
    AND status IN ('confirmed', 'pending')
    AND NOT (check_out <= p_check_in OR check_in >= p_check_out);
    
    RETURN (unavailable_count = 0 AND existing_booking_count = 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get loft price for a specific date (with override support)
CREATE OR REPLACE FUNCTION get_loft_price_for_date(
    p_loft_id UUID,
    p_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    override_price DECIMAL(10,2);
    base_price DECIMAL(10,2);
BEGIN
    -- Check for price override first
    SELECT price_override
    INTO override_price
    FROM loft_availability
    WHERE loft_id = p_loft_id
    AND date = p_date
    AND price_override IS NOT NULL;
    
    IF override_price IS NOT NULL THEN
        RETURN override_price;
    END IF;
    
    -- Get base price from loft
    SELECT COALESCE(price_per_night, 0)
    INTO base_price
    FROM lofts
    WHERE id = p_loft_id;
    
    RETURN COALESCE(base_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total booking price
CREATE OR REPLACE FUNCTION calculate_booking_total(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_price DECIMAL(10,2) := 0;
    current_date DATE;
    daily_price DECIMAL(10,2);
BEGIN
    current_date := p_check_in;
    
    WHILE current_date < p_check_out LOOP
        daily_price := get_loft_price_for_date(p_loft_id, current_date);
        total_price := total_price + daily_price;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE partner_profiles IS 'Extended profile information for partner users including business details and verification status';
COMMENT ON TABLE bookings IS 'Main booking records linking clients, partners, and lofts with reservation details';
COMMENT ON TABLE loft_availability IS 'Calendar management for loft availability and dynamic pricing';
COMMENT ON TABLE booking_messages IS 'Communication system between clients and partners within booking context';
COMMENT ON TABLE loft_reviews IS 'Client reviews and ratings for completed bookings';
COMMENT ON TABLE booking_fees IS 'Additional fees and charges associated with bookings';

COMMENT ON FUNCTION check_loft_availability IS 'Checks if a loft is available for booking in the specified date range';
COMMENT ON FUNCTION get_loft_price_for_date IS 'Returns the price for a loft on a specific date, considering overrides';
COMMENT ON FUNCTION calculate_booking_total IS 'Calculates the total price for a booking based on daily rates';