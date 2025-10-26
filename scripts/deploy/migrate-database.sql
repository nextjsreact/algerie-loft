-- Multi-Role Booking System Database Migration Script
-- This script creates all necessary tables and functions for the multi-role booking system
-- Run this script in production environment after backup

BEGIN;

-- Create partner_profiles table
CREATE TABLE IF NOT EXISTS partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company')),
  tax_id TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents TEXT[],
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loft_availability table
CREATE TABLE IF NOT EXISTS loft_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_override DECIMAL(10,2),
  minimum_stay INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(loft_id, date)
);

-- Create booking_messages table
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  minimum_stay INTEGER DEFAULT 1,
  rule_type TEXT DEFAULT 'custom' CHECK (rule_type IN ('seasonal', 'event', 'weekend', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_multiplier CHECK (price_multiplier > 0 AND price_multiplier <= 10)
);

-- Add partner_profile_id to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_profile_id UUID REFERENCES partner_profiles(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_loft_id ON bookings(loft_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_loft_availability_loft_date ON loft_availability(loft_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_loft_id ON pricing_rules(loft_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);

-- Enable RLS on new tables
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partner_profiles
CREATE POLICY "Partners can view own profile" ON partner_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can update own profile" ON partner_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all partner profiles" ON partner_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'executive')
    )
  );

-- Create RLS policies for bookings
CREATE POLICY "Clients can view own bookings" ON bookings
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Partners can view bookings for their lofts" ON bookings
  FOR SELECT USING (partner_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'executive')
    )
  );

-- Create RLS policies for loft_availability
CREATE POLICY "Everyone can view availability" ON loft_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Partners can manage availability for own lofts" ON loft_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lofts 
      WHERE lofts.id = loft_availability.loft_id 
      AND lofts.owner_id = auth.uid()
    )
  );

-- Create RLS policies for booking_messages
CREATE POLICY "Booking participants can view messages" ON booking_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_messages.booking_id 
      AND (bookings.client_id = auth.uid() OR bookings.partner_id = auth.uid())
    )
  );

CREATE POLICY "Booking participants can send messages" ON booking_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_messages.booking_id 
      AND (bookings.client_id = auth.uid() OR bookings.partner_id = auth.uid())
    )
  );

-- Create RLS policies for pricing_rules
CREATE POLICY "Everyone can view active pricing rules" ON pricing_rules
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Partners can manage pricing rules for own lofts" ON pricing_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lofts 
      WHERE lofts.id = pricing_rules.loft_id 
      AND lofts.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all pricing rules" ON pricing_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'executive')
    )
  );

COMMIT;