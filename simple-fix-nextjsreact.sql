-- SIMPLE FIX for nextjsreact@gmail.com role synchronization
-- This version avoids type casting issues

-- First, let's see the current state
SELECT 'BEFORE FIX - Profile:' as info, id, email, role 
FROM profiles 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'BEFORE FIX - Auth metadata:' as info, 
       id, email, 
       raw_user_meta_data->>'role' as metadata_role,
       raw_user_meta_data->>'active_role' as active_role
FROM auth.users 
WHERE email = 'nextjsreact@gmail.com';

-- Update profiles table
UPDATE profiles 
SET role = 'executive', updated_at = NOW()
WHERE email = 'nextjsreact@gmail.com';

-- Update auth metadata using simple string replacement
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "executive", "active_role": "executive"}'::jsonb
WHERE email = 'nextjsreact@gmail.com';

-- Verify the fix
SELECT 'AFTER FIX - Profile:' as info, id, email, role 
FROM profiles 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'AFTER FIX - Auth metadata:' as info, 
       id, email, 
       raw_user_meta_data->>'role' as metadata_role,
       raw_user_meta_data->>'active_role' as active_role
FROM auth.users 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'Simple fix completed!' as status;