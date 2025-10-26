-- Row Level Security (RLS) for Multi-Role Booking System
-- This script sets up security policies to ensure data isolation between different user roles

-- Enable RLS on all new tables
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_fees ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role from profiles table
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is a partner who owns a loft
CREATE OR REPLACE FUNCTION user_owns_loft(loft_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM lofts l
        JOIN partner_profiles pp ON l.owner_id = pp.user_id
        WHERE l.id = loft_id 
        AND pp.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is involved in a booking (client or partner)
CREATE OR REPLACE FUNCTION user_involved_in_booking(booking_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM bookings 
        WHERE id = booking_id 
        AND (client_id = auth.uid() OR partner_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTNER PROFILES POLICIES
-- Partners can only see and modify their own profile
CREATE POLICY "Partners can view own profile" ON partner_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can insert own profile" ON partner_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Partners can update own profile" ON partner_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Admins and managers can view all partner profiles
CREATE POLICY "Admins can view all partner profiles" ON partner_profiles
    FOR SELECT USING (get_current_user_role() IN ('admin', 'manager'));

-- Admins and managers can update partner profiles (for verification)
CREATE POLICY "Admins can update partner profiles" ON partner_profiles
    FOR UPDATE USING (get_current_user_role() IN ('admin', 'manager'));

-- BOOKINGS POLICIES
-- Clients can view their own bookings
CREATE POLICY "Clients can view own bookings" ON bookings
    FOR SELECT USING (client_id = auth.uid());

-- Partners can view bookings for their lofts
CREATE POLICY "Partners can view loft bookings" ON bookings
    FOR SELECT USING (partner_id = auth.uid());

-- Clients can create bookings
CREATE POLICY "Clients can create bookings" ON bookings
    FOR INSERT WITH CHECK (
        client_id = auth.uid() 
        AND get_current_user_role() = 'client'
    );

-- Clients can update their own bookings (limited fields)
CREATE POLICY "Clients can update own bookings" ON bookings
    FOR UPDATE USING (
        client_id = auth.uid() 
        AND get_current_user_role() = 'client'
    );

-- Partners can update bookings for their lofts (status changes)
CREATE POLICY "Partners can update loft bookings" ON bookings
    FOR UPDATE USING (
        partner_id = auth.uid() 
        AND get_current_user_role() = 'partner'
    );

-- Admins and managers can view and update all bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- LOFT AVAILABILITY POLICIES
-- Everyone can view availability (for search)
CREATE POLICY "Public can view loft availability" ON loft_availability
    FOR SELECT TO authenticated USING (true);

-- Partners can manage availability for their own lofts
CREATE POLICY "Partners can manage own loft availability" ON loft_availability
    FOR ALL USING (user_owns_loft(loft_id));

-- Admins and managers can manage all loft availability
CREATE POLICY "Admins can manage all loft availability" ON loft_availability
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- BOOKING MESSAGES POLICIES
-- Users can view messages for bookings they're involved in
CREATE POLICY "Users can view booking messages" ON booking_messages
    FOR SELECT USING (user_involved_in_booking(booking_id));

-- Users can send messages for bookings they're involved in
CREATE POLICY "Users can send booking messages" ON booking_messages
    FOR INSERT WITH CHECK (
        user_involved_in_booking(booking_id) 
        AND sender_id = auth.uid()
    );

-- Users can update read status of their received messages
CREATE POLICY "Users can update message read status" ON booking_messages
    FOR UPDATE USING (
        user_involved_in_booking(booking_id) 
        AND sender_id != auth.uid()
    );

-- Admins can view and manage all messages
CREATE POLICY "Admins can manage all messages" ON booking_messages
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- LOFT REVIEWS POLICIES
-- Everyone can view published reviews
CREATE POLICY "Public can view published reviews" ON loft_reviews
    FOR SELECT USING (is_published = true);

-- Clients can view and create reviews for their completed bookings
CREATE POLICY "Clients can manage own reviews" ON loft_reviews
    FOR ALL USING (client_id = auth.uid());

-- Partners can view reviews for their lofts and respond
CREATE POLICY "Partners can view and respond to loft reviews" ON loft_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_id 
            AND b.partner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can respond to reviews" ON loft_reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_id 
            AND b.partner_id = auth.uid()
        )
    );

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON loft_reviews
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- BOOKING FEES POLICIES
-- Users can view fees for bookings they're involved in
CREATE POLICY "Users can view booking fees" ON booking_fees
    FOR SELECT USING (user_involved_in_booking(booking_id));

-- Partners can add fees to their bookings
CREATE POLICY "Partners can add booking fees" ON booking_fees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_id 
            AND b.partner_id = auth.uid()
        )
    );

-- Admins can manage all booking fees
CREATE POLICY "Admins can manage all booking fees" ON booking_fees
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- EXTEND EXISTING LOFTS TABLE POLICIES FOR MULTI-ROLE ACCESS
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view lofts" ON lofts;
DROP POLICY IF EXISTS "Admins can manage lofts" ON lofts;

-- Everyone can view published lofts (for search)
CREATE POLICY "Public can view available lofts" ON lofts
    FOR SELECT TO authenticated USING (
        status = 'available' 
        OR get_current_user_role() IN ('admin', 'manager', 'executive')
        OR owner_id IN (
            SELECT user_id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

-- Partners can manage their own lofts
CREATE POLICY "Partners can manage own lofts" ON lofts
    FOR ALL USING (
        owner_id IN (
            SELECT user_id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

-- Admins and managers can manage all lofts
CREATE POLICY "Admins can manage all lofts" ON lofts
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- Create function to search available lofts (public function for clients)
CREATE OR REPLACE FUNCTION search_available_lofts(
    p_check_in DATE DEFAULT NULL,
    p_check_out DATE DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_guests INTEGER DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    description TEXT,
    price_per_night DECIMAL,
    status loft_status,
    average_rating DECIMAL,
    review_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.address,
        l.description,
        l.price_per_night,
        l.status,
        COALESCE(AVG(lr.rating), 0)::DECIMAL as average_rating,
        COUNT(lr.id) as review_count
    FROM lofts l
    LEFT JOIN loft_reviews lr ON l.id = lr.loft_id AND lr.is_published = true
    WHERE l.status = 'available'
    AND (p_location IS NULL OR l.address ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR l.price_per_night >= p_min_price)
    AND (p_max_price IS NULL OR l.price_per_night <= p_max_price)
    AND (
        p_check_in IS NULL OR p_check_out IS NULL 
        OR check_loft_availability(l.id, p_check_in, p_check_out)
    )
    GROUP BY l.id, l.name, l.address, l.description, l.price_per_night, l.status
    ORDER BY average_rating DESC, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_loft(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_involved_in_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_loft_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loft_price_for_date(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_booking_total(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION search_available_lofts(DATE, DATE, TEXT, DECIMAL, DECIMAL, INTEGER) TO authenticated;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_lofts_owner_id ON lofts(owner_id);
CREATE INDEX IF NOT EXISTS idx_lofts_status ON lofts(status);

-- Add comments for documentation
COMMENT ON FUNCTION get_current_user_role IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION user_owns_loft IS 'Checks if the current user owns the specified loft';
COMMENT ON FUNCTION user_involved_in_booking IS 'Checks if the current user is involved in the specified booking';
COMMENT ON FUNCTION search_available_lofts IS 'Public function to search for available lofts with filters';