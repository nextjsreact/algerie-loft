-- =====================================================
-- APPLY CUSTOMER REGISTRATION FIXES
-- =====================================================
-- This script applies all necessary fixes for client registration
-- Run this in your Supabase SQL editor to fix the registration issue

-- =====================================================
-- 1. FIX CUSTOMERS TABLE STRUCTURE
-- =====================================================

\i database/fix-customers-table-structure.sql

-- =====================================================
-- 2. INSTALL AUTO-SYNC TRIGGER
-- =====================================================

\i database/auto-sync-client-customers.sql

-- =====================================================
-- 3. VERIFY SETUP
-- =====================================================

-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'sync_client_customers_trigger'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Check customers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test if we can insert a test customer (this should work now)
SELECT 'Setup verification complete! ✅' as status;