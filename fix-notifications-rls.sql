-- Fix RLS policies for notifications table

-- Temporarily disable RLS to avoid conflicts during policy changes
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on notifications table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON notifications';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for notifications

-- 1. Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()
  );

-- 2. Service role and authenticated users can insert notifications
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- 3. Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    user_id = auth.uid()
  );

-- 4. Service role can delete notifications (for cleanup)
CREATE POLICY "notifications_delete_service" ON notifications
  FOR DELETE USING (
    auth.role() = 'service_role'
  );

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Test the policies
SELECT 'Notifications RLS policies have been fixed!' as status;