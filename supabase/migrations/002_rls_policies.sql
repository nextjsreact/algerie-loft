-- =====================================================
-- Migration: Booking Sync System - RLS Policies
-- Description: Row Level Security policies for all tables
-- Date: 2026-05-14
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE property_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Note: lofts table RLS should already be enabled from existing setup
-- If not, uncomment the following line:
-- ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. LOFTS TABLE POLICIES (if not already exist)
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can read lofts" ON lofts;

-- Authenticated users can read all lofts
CREATE POLICY "Authenticated users can read lofts"
  ON lofts FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 3. PROPERTY_SYNC_CONFIG TABLE POLICIES
-- =====================================================

-- Authenticated users can read sync config
CREATE POLICY "Authenticated users can read sync config"
  ON property_sync_config FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert sync config
CREATE POLICY "Admins can insert sync config"
  ON property_sync_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can update sync config
CREATE POLICY "Admins can update sync config"
  ON property_sync_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can delete sync config
CREATE POLICY "Admins can delete sync config"
  ON property_sync_config FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Service role bypasses RLS
CREATE POLICY "Service role can manage sync config"
  ON property_sync_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. AIRBNB_BOOKINGS TABLE POLICIES
-- =====================================================

-- Authenticated users can read all bookings
CREATE POLICY "Authenticated users can read airbnb bookings"
  ON airbnb_bookings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manually insert bookings
CREATE POLICY "Admins can insert airbnb bookings"
  ON airbnb_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can update bookings
CREATE POLICY "Admins can update airbnb bookings"
  ON airbnb_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can delete bookings
CREATE POLICY "Admins can delete airbnb bookings"
  ON airbnb_bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Service role bypasses RLS (for sync operations)
CREATE POLICY "Service role can manage airbnb bookings"
  ON airbnb_bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. AIRBNB_CONFLICTS TABLE POLICIES
-- =====================================================

-- Authenticated users can read conflicts
CREATE POLICY "Authenticated users can read airbnb conflicts"
  ON airbnb_conflicts FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert conflicts (manual creation)
CREATE POLICY "Admins can insert airbnb conflicts"
  ON airbnb_conflicts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can update conflicts (resolve, ignore)
CREATE POLICY "Admins can update airbnb conflicts"
  ON airbnb_conflicts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can delete conflicts
CREATE POLICY "Admins can delete airbnb conflicts"
  ON airbnb_conflicts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Service role bypasses RLS (for automatic conflict detection)
CREATE POLICY "Service role can manage airbnb conflicts"
  ON airbnb_conflicts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. AIRBNB_SYNC_LOGS TABLE POLICIES
-- =====================================================

-- Authenticated users can read sync logs
CREATE POLICY "Authenticated users can read airbnb sync logs"
  ON airbnb_sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert sync logs (manual logging)
CREATE POLICY "Admins can insert airbnb sync logs"
  ON airbnb_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Service role bypasses RLS (for automatic logging)
CREATE POLICY "Service role can manage airbnb sync logs"
  ON airbnb_sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. SYSTEM_SETTINGS TABLE POLICIES
-- =====================================================

-- Authenticated users can read system settings
CREATE POLICY "Authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update system settings
CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Only admins can insert system settings
CREATE POLICY "Admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_user_meta_data->>'role' = 'superuser')
    )
  );

-- Service role bypasses RLS
CREATE POLICY "Service role can manage system settings"
  ON system_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. HELPER FUNCTION: Check if user is admin
-- =====================================================

-- Create a helper function to check admin role (reusable)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
         OR auth.users.raw_user_meta_data->>'role' = 'superuser')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is admin or superuser';

-- =====================================================
-- 9. VALIDATION
-- =====================================================

DO $$
DECLARE
  rls_enabled_count INTEGER;
  policies_count INTEGER;
BEGIN
  -- Check RLS is enabled on all tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('property_sync_config', 'airbnb_bookings', 'airbnb_conflicts', 'airbnb_sync_logs', 'system_settings')
  AND rowsecurity = true;
  
  ASSERT rls_enabled_count = 5, 'RLS not enabled on all tables';
  
  -- Check policies exist
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('property_sync_config', 'airbnb_bookings', 'airbnb_conflicts', 'airbnb_sync_logs', 'system_settings');
  
  ASSERT policies_count >= 20, 'Not enough policies created';
  
  RAISE NOTICE 'Migration 002 completed successfully: RLS enabled and % policies created', policies_count;
END $$;
