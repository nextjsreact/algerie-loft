-- IMMEDIATE FIX for nextjsreact@gmail.com role synchronization
-- Run this to fix the metadata mismatch right now

-- Update auth.users metadata to match the executive role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    jsonb_set(
        jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"executive"'
        ),
        '{active_role}',
        '"executive"'
    ),
    '{last_role_update}',
    to_jsonb(NOW()::text)
)
WHERE email = 'nextjsreact@gmail.com';

-- Ensure profiles table is correct
UPDATE profiles 
SET 
    role = 'executive',
    updated_at = NOW()
WHERE email = 'nextjsreact@gmail.com';

-- Verification
SELECT 'AFTER FIX - Profile role:' as check_type, role 
FROM profiles 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'AFTER FIX - Auth metadata role:' as check_type, 
       raw_user_meta_data->>'role' as metadata_role,
       raw_user_meta_data->>'active_role' as active_role
FROM auth.users 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'Fix completed successfully!' as status;