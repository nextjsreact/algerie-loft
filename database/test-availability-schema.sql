-- =====================================================
-- AVAILABILITY SCHEMA TEST SCRIPT
-- =====================================================
-- Simple test to verify the availability schema works correctly
-- Run this after applying the main schema to test functionality

-- Test 1: Basic availability check
DO $$
BEGIN
    -- This should not fail if the schema is properly created
    RAISE NOTICE 'Testing availability schema...';
    
    -- Test the check_availability function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_availability') THEN
        RAISE NOTICE '✓ check_availability function exists';
    ELSE
        RAISE EXCEPTION '✗ check_availability function missing';
    END IF;
    
    -- Test the check_overlapping_locks function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_overlapping_locks') THEN
        RAISE NOTICE '✓ check_overlapping_locks function exists';
    ELSE
        RAISE EXCEPTION '✗ check_overlapping_locks function missing';
    END IF;
    
    -- Test the create_reservation_lock function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_reservation_lock') THEN
        RAISE NOTICE '✓ create_reservation_lock function exists';
    ELSE
        RAISE EXCEPTION '✗ create_reservation_lock function missing';
    END IF;
    
    -- Test the cleanup_expired_locks function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_locks') THEN
        RAISE NOTICE '✓ cleanup_expired_locks function exists';
    ELSE
        RAISE EXCEPTION '✗ cleanup_expired_locks function missing';
    END IF;
    
    -- Test tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availability') THEN
        RAISE NOTICE '✓ availability table exists';
    ELSE
        RAISE EXCEPTION '✗ availability table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_locks') THEN
        RAISE NOTICE '✓ reservation_locks table exists';
    ELSE
        RAISE EXCEPTION '✗ reservation_locks table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        RAISE NOTICE '✓ pricing_rules table exists';
    ELSE
        RAISE EXCEPTION '✗ pricing_rules table missing';
    END IF;
    
    RAISE NOTICE '✓ All availability schema components created successfully!';
END $$;

-- Test 2: Test cleanup function
SELECT cleanup_expired_locks() as expired_locks_cleaned;

-- Test 3: Show table structures
\d availability
\d reservation_locks  
\d pricing_rules

-- Test 4: Show indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('availability', 'reservation_locks', 'pricing_rules')
ORDER BY tablename, indexname;

RAISE NOTICE 'Availability schema test completed successfully!';