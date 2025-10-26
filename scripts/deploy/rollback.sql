-- Multi-Role Booking System Rollback Script
-- Use this script to rollback database changes if deployment fails

BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS "Booking participants can send messages" ON booking_messages;
DROP POLICY IF EXISTS "Booking participants can view messages" ON booking_messages;
DROP POLICY IF EXISTS "Partners can manage availability for own lofts" ON loft_availability;
DROP POLICY IF EXISTS "Everyone can view availability" ON loft_availability;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Partners can view bookings for their lofts" ON bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all partner profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Partners can update own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;

-- Drop indexes
DROP INDEX IF EXISTS idx_partner_profiles_user_id;
DROP INDEX IF EXISTS idx_booking_messages_booking_id;
DROP INDEX IF EXISTS idx_loft_availability_loft_date;
DROP INDEX IF EXISTS idx_bookings_dates;
DROP INDEX IF EXISTS idx_bookings_partner_id;
DROP INDEX IF EXISTS idx_bookings_client_id;
DROP INDEX IF EXISTS idx_bookings_loft_id;

-- Remove column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS partner_profile_id;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS booking_messages;
DROP TABLE IF EXISTS loft_availability;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS partner_profiles;

COMMIT;