-- Fix RLS policies for partner_profiles to allow any authenticated user to create their own profile
-- This allows users with any role (admin, executive, client, etc.) to register as partners

-- Drop existing restrictive insert policy if it exists
DROP POLICY IF EXISTS "Partners can insert own profile" ON partner_profiles;

-- Create new insert policy that allows any authenticated user to create their own profile
CREATE POLICY "Authenticated users can create own partner profile" ON partner_profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Ensure the select policy allows users to view their own profile
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;

CREATE POLICY "Users can view own partner profile" ON partner_profiles
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Ensure the update policy allows users to update their own profile
DROP POLICY IF EXISTS "Partners can update own profile" ON partner_profiles;

CREATE POLICY "Users can update own partner profile" ON partner_profiles
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid());

-- Keep admin policies for viewing and updating all profiles
-- (These should already exist from previous migrations)
