-- Function to sync user role from profiles table to auth.users metadata
-- This ensures consistency between the profiles table and Supabase Auth metadata

CREATE OR REPLACE FUNCTION sync_user_role_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users metadata when role changes in profiles
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role::text)
    ),
    '{active_role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync role changes
DROP TRIGGER IF EXISTS sync_role_metadata_trigger ON profiles;
CREATE TRIGGER sync_role_metadata_trigger
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION sync_user_role_metadata();

-- Manual sync for existing users (run once)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(p.role::text)
  ),
  '{active_role}',
  to_jsonb(p.role::text)
)
FROM profiles p
WHERE auth.users.id = p.id
  AND (
    raw_user_meta_data->>'role' IS DISTINCT FROM p.role::text
    OR raw_user_meta_data->>'active_role' IS DISTINCT FROM p.role::text
  );

-- Verification query
SELECT 
  'Verification - Users with synced roles:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = p.role::text THEN 1 END) as synced_users
FROM auth.users u
JOIN profiles p ON u.id = p.id;