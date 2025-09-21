-- Fix missing price_per_month values in lofts table
-- This script populates null price_per_month values with reasonable defaults

-- First, let's see what data we have
SELECT
    id,
    name,
    price_per_month,
    price_per_night,
    status,
    created_at
FROM lofts
WHERE price_per_month IS NULL
ORDER BY created_at DESC;

-- Update lofts with null price_per_month using price_per_night if available
UPDATE lofts
SET price_per_month = price_per_night * 30
WHERE price_per_month IS NULL
  AND price_per_night IS NOT NULL;

-- For lofts that still have null price_per_month, set a reasonable default based on status
UPDATE lofts
SET price_per_month = CASE
    WHEN status = 'available' THEN 45000
    WHEN status = 'occupied' THEN 55000
    WHEN status = 'maintenance' THEN 35000
    ELSE 40000
END
WHERE price_per_month IS NULL;

-- Verify the fixes
SELECT
    id,
    name,
    price_per_month,
    price_per_night,
    status,
    CASE
        WHEN price_per_month >= 50000 THEN 'High-end'
        WHEN price_per_month >= 30000 THEN 'Mid-range'
        ELSE 'Budget'
    END as price_category
FROM lofts
WHERE price_per_month IS NOT NULL
ORDER BY price_per_month DESC;

-- Show summary statistics
SELECT
    COUNT(*) as total_lofts,
    COUNT(price_per_month) as lofts_with_price,
    COUNT(price_per_night) as lofts_with_night_price,
    AVG(price_per_month) as avg_monthly_price,
    MIN(price_per_month) as min_monthly_price,
    MAX(price_per_month) as max_monthly_price
FROM lofts;