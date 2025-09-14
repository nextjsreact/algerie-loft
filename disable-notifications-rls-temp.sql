-- Temporary fix: Disable RLS on notifications table for testing
-- WARNING: This removes security - use only for testing!

-- Drop all existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON notifications';
    END LOOP;
END $$;

-- Completely disable RLS for notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON notifications TO anon;

SELECT 'RLS disabled on notifications table - TESTING ONLY!' as status;