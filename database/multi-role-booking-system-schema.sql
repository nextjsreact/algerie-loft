-- Multi-Role Booking System Database Schema
-- This schema extends the existing system with client and partner roles

-- First, add new roles to the existing user system
-- Note: This assumes profiles table already exists

-- Create partner profiles table for business information
CREATE TABLE IF NOT EXISTS partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company')) DEFAULT 'individual',
  tax_id TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents TEXT[] DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table for reservation management
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests TEXT,
  booking_reference TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure check_out is after check_in
  CONSTRAINT valid_date_range CHECK (check_out > check_in)
);

-- Create loft availability table for calendar management
CREATE TABLE IF NOT EXISTS loft_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_override DECIMAL(10,2) CHECK (price_override >= 0),
  minimum_stay INTEGER DEFAULT 1 CHECK (minimum_stay > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same loft and date
  UNIQUE(loft_id, date)
);

-- Create booking messages table for client-partner communication
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loft images table for property photos
CREATE TABLE IF NOT EXISTS loft_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loft amenities table
CREATE TABLE IF NOT EXISTS loft_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  amenity_name TEXT NOT NULL,
  amenity_category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking reviews table for client feedback
CREATE TABLE IF NOT EXISTS booking_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
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

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender_id ON booking_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_loft_images_loft_id ON loft_images(loft_id);
CREATE INDEX IF NOT EXISTS idx_loft_images_primary ON loft_images(loft_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_loft_amenities_loft_id ON loft_amenities(loft_id);

CREATE INDEX IF NOT EXISTS idx_booking_reviews_loft_id ON booking_reviews(loft_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_rating ON booking_reviews(rating);

-- Create functions for booking reference generation
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_partner_profiles_updated_at
  BEFORE UPDATE ON partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews ENABLE ROW LEVEL SECURITY;

-- Partner profiles policies
CREATE POLICY "Partners can view own profile" ON partner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own profile" ON partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partner profiles" ON partner_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Bookings policies
CREATE POLICY "Clients can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Partners can view bookings for their lofts" ON bookings
  FOR SELECT USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM lofts 
      WHERE lofts.id = bookings.loft_id 
      AND EXISTS (
        SELECT 1 FROM partner_profiles 
        WHERE partner_profiles.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Partners can update booking status" ON bookings
  FOR UPDATE USING (auth.uid() = partner_id);

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Loft availability policies
CREATE POLICY "Everyone can view availability" ON loft_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Partners can manage availability for own lofts" ON loft_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lofts 
      JOIN partner_profiles ON partner_profiles.user_id = auth.uid()
      WHERE lofts.id = loft_availability.loft_id
    )
  );

CREATE POLICY "Admins can manage all availability" ON loft_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Booking messages policies
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
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_messages.booking_id 
      AND (bookings.client_id = auth.uid() OR bookings.partner_id = auth.uid())
    )
  );

-- Loft images policies
CREATE POLICY "Everyone can view loft images" ON loft_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Partners can manage images for own lofts" ON loft_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lofts 
      JOIN partner_profiles ON partner_profiles.user_id = auth.uid()
      WHERE lofts.id = loft_images.loft_id
    )
  );

-- Loft amenities policies
CREATE POLICY "Everyone can view loft amenities" ON loft_amenities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Partners can manage amenities for own lofts" ON loft_amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lofts 
      JOIN partner_profiles ON partner_profiles.user_id = auth.uid()
      WHERE lofts.id = loft_amenities.loft_id
    )
  );

-- Booking reviews policies
CREATE POLICY "Everyone can view reviews" ON booking_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clients can create reviews for own bookings" ON booking_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_reviews.booking_id 
      AND bookings.client_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Create view for loft search with availability
CREATE OR REPLACE VIEW loft_search_view AS
SELECT 
  l.*,
  pp.business_name as partner_name,
  COALESCE(AVG(br.rating), 0) as average_rating,
  COUNT(br.id) as review_count,
  (
    SELECT json_agg(
      json_build_object(
        'url', li.image_url,
        'alt', li.alt_text,
        'is_primary', li.is_primary
      ) ORDER BY li.display_order, li.created_at
    )
    FROM loft_images li 
    WHERE li.loft_id = l.id
  ) as images,
  (
    SELECT json_agg(
      json_build_object(
        'name', la.amenity_name,
        'category', la.amenity_category
      )
    )
    FROM loft_amenities la 
    WHERE la.loft_id = l.id
  ) as amenities
FROM lofts l
LEFT JOIN partner_profiles pp ON pp.user_id = l.owner_id
LEFT JOIN booking_reviews br ON br.loft_id = l.id
WHERE l.status = 'available'
GROUP BY l.id, pp.business_name;

-- Create function to check loft availability for date range
CREATE OR REPLACE FUNCTION check_loft_availability(
  p_loft_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  unavailable_count INTEGER;
  booking_conflict_count INTEGER;
BEGIN
  -- Check if any dates in range are marked as unavailable
  SELECT COUNT(*)
  INTO unavailable_count
  FROM loft_availability
  WHERE loft_id = p_loft_id
    AND date >= p_check_in
    AND date < p_check_out
    AND is_available = false;
  
  -- Check for booking conflicts
  SELECT COUNT(*)
  INTO booking_conflict_count
  FROM bookings
  WHERE loft_id = p_loft_id
    AND status IN ('confirmed', 'pending')
    AND (
      (check_in <= p_check_in AND check_out > p_check_in) OR
      (check_in < p_check_out AND check_out >= p_check_out) OR
      (check_in >= p_check_in AND check_out <= p_check_out)
    );
  
  RETURN (unavailable_count = 0 AND booking_conflict_count = 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get available lofts for date range
CREATE OR REPLACE FUNCTION get_available_lofts(
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER DEFAULT 1,
  p_min_price DECIMAL DEFAULT 0,
  p_max_price DECIMAL DEFAULT 999999,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  loft_data JSON,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH available_lofts AS (
    SELECT l.*
    FROM loft_search_view l
    WHERE l.price_per_night >= p_min_price
      AND l.price_per_night <= p_max_price
      AND check_loft_availability(l.id, p_check_in, p_check_out)
  ),
  total AS (
    SELECT COUNT(*) as count FROM available_lofts
  )
  SELECT 
    row_to_json(al.*) as loft_data,
    t.count as total_count
  FROM available_lofts al
  CROSS JOIN total t
  ORDER BY al.average_rating DESC, al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert some sample amenities for testing
INSERT INTO loft_amenities (loft_id, amenity_name, amenity_category)
SELECT 
  l.id,
  unnest(ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Parking']),
  'essential'
FROM lofts l
WHERE NOT EXISTS (
  SELECT 1 FROM loft_amenities la WHERE la.loft_id = l.id
)
LIMIT 5;

COMMENT ON TABLE partner_profiles IS 'Business information and verification status for property partners';
COMMENT ON TABLE bookings IS 'Reservation records linking clients, partners, and lofts';
COMMENT ON TABLE loft_availability IS 'Calendar availability and pricing overrides for lofts';
COMMENT ON TABLE booking_messages IS 'Communication between clients and partners regarding bookings';
COMMENT ON TABLE loft_images IS 'Photo gallery for loft properties';
COMMENT ON TABLE loft_amenities IS 'Features and amenities available in each loft';
COMMENT ON TABLE booking_reviews IS 'Client reviews and ratings for completed bookings';