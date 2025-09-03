-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON notifications;

-- Allow authenticated users to insert notifications for any user (as long as they are authenticated)
CREATE POLICY "Allow authenticated users to insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
