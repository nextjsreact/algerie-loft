-- FIX ROLE SYNCHRONIZATION FOR nextjsreact@gmail.com
-- This script fixes the metadata mismatch between profiles table and auth.users

-- Step 1: Update the user metadata in auth.users to match the executive role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    jsonb_set(
        raw_user_meta_data,
        '{role}',
        '"executive"'
    ),
    '{active_role}',
    '"executive"'
)
WHERE email = 'nextjsreact@gmail.com';

-- Step 2: Ensure the profiles table is also correct
UPDATE profiles 
SET 
    role = 'executive',
    updated_at = NOW()
WHERE email = 'nextjsreact@gmail.com';

-- Step 3: Verification - Check both tables
SELECT 'VERIFICATION - Profiles table:' as info;
SELECT id, email, full_name, role, updated_at
FROM profiles
WHERE email = 'nextjsreact@gmail.com';

SELECT 'VERIFICATION - Auth metadata:' as info;
SELECT id, email, raw_user_meta_data->'role' as metadata_role, raw_user_meta_data->'active_role' as active_role
FROM auth.users
WHERE email = 'nextjsreact@gmail.com';

SELECT 'Role synchronization completed!' as status;