-- Check if executive users are linked to owners table
-- This query will help identify the problem

-- First, let's see all users with executive role
SELECT 
    'Users with executive role:' as info,
    id,
    email,
    role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'executive'
   OR raw_user_meta_data->>'profile_role' = 'executive';

-- Then check if any of these users are linked in the owners table
SELECT 
    'Owners linked to users:' as info,
    o.id as owner_id,
    o.name as owner_name,
    o.user_id,
    u.email as user_email,
    u.raw_user_meta_data->>'role' as user_role
FROM owners o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE o.user_id IS NOT NULL
ORDER BY o.name;

-- Count total owners
SELECT 
    'Total owners count:' as info,
    COUNT(*) as total_owners
FROM owners;

-- Show sample of all owners
SELECT 
    'Sample owners:' as info,
    id,
    name,
    user_id,
    email
FROM owners
ORDER BY name
LIMIT 10;