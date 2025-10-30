-- =====================================================
-- AVAILABILITY ENGINE AND PRICING SYSTEM SCHEMA
-- =====================================================
-- Enhanced availability and pricing system for client reservation flow
-- Includes availability tracking, pricing rules, and reservation locking

-- =====================================================
-- 1. ENHANCED AVAILABILITY TABLE
-- =====================================================

-- Ensure the loft_availability table has all required columns
DO $
BEGIN
    -- Add missing columns to existing loft_availability table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loft_availability' AND column_name = 'blocked_reason') THEN
        ALTER TABLE loft_availability ADD COLUMN blocked_reason VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM informa