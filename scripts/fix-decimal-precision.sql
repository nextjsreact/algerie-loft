-- Refactored to remove duplicated category logic and improve maintainability.

-- Helper function to determine transaction category from description
CREATE OR REPLACE FUNCTION get_transaction_category(description TEXT)
RETURNS VARCHAR(100) AS $$
BEGIN
  RETURN COALESCE(
    CASE
      WHEN LOWER(description) LIKE '%maintenance%' THEN 'maintenance'
      WHEN LOWER(description) LIKE '%cleaning%' OR LOWER(description) LIKE '%nettoyage%' THEN 'cleaning'
      WHEN LOWER(description) LIKE '%repair%' OR LOWER(description) LIKE '%réparation%' THEN 'repair'
      WHEN LOWER(description) LIKE '%plumbing%' OR LOWER(description) LIKE '%plomberie%' THEN 'plumbing'
      WHEN LOWER(description) LIKE '%electrical%' OR LOWER(description) LIKE '%électricité%' THEN 'electrical'
      WHEN LOWER(description) LIKE '%painting%' OR LOWER(description) LIKE '%peinture%' THEN 'painting'
      WHEN LOWER(description) LIKE '%security%' OR LOWER(description) LIKE '%sécurité%' THEN 'security'
      WHEN LOWER(description) LIKE '%inspection%' THEN 'inspection'
      WHEN LOWER(description) LIKE '%utilities%' OR LOWER(description) LIKE '%factures%' THEN 'utilities'
      WHEN LOWER(description) LIKE '%insurance%' OR LOWER(description) LIKE '%assurance%' THEN 'insurance'
      WHEN LOWER(description) LIKE '%tax%' OR LOWER(description) LIKE '%impôt%' THEN 'taxes'
      WHEN LOWER(description) LIKE '%bill%' OR LOWER(description) LIKE '%facture%' THEN 'utilities'
      WHEN LOWER(description) LIKE '%water%' OR LOWER(description) LIKE '%eau%' THEN 'utilities'
      WHEN LOWER(description) LIKE '%energy%' OR LOWER(description) LIKE '%énergie%' THEN 'utilities'
      WHEN LOWER(description) LIKE '%phone%' OR LOWER(description) LIKE '%téléphone%' THEN 'utilities'
      WHEN LOWER(description) LIKE '%internet%' THEN 'utilities'
      ELSE 'other'
    END,
    'other'
  );
END;
$$ LANGUAGE plpgsql;

-- Fix DECIMAL precision overflow in transaction reference checking
-- This fixes the error: numeric field overflow (precision 5, scale 2)

-- Drop and recreate the function with proper precision, now using the helper function
DROP FUNCTION IF EXISTS check_transaction_amount_vs_reference();

CREATE OR REPLACE FUNCTION check_transaction_amount_vs_reference()
RETURNS TRIGGER AS $$
DECLARE
  reference_amount DECIMAL(10,2);
  category_name VARCHAR(100);
  percentage_over DECIMAL(10,2); -- Changed from DECIMAL(5,2) to DECIMAL(10,2)
  alert_threshold DECIMAL(10,2) := 20.00; -- Changed from DECIMAL(5,2) to DECIMAL(10,2)
  loft_name TEXT;
BEGIN
  -- Only check if amount is provided and > 0
  IF NEW.amount IS NOT NULL AND NEW.amount > 0 THEN
    
    -- Get category using the helper function
    category_name := get_transaction_category(NEW.description);
    
    -- Get reference amount for this category
    SELECT tcr.reference_amount INTO reference_amount
    FROM transaction_category_references tcr
    WHERE tcr.category = category_name 
    AND tcr.transaction_type = 'expense'
    LIMIT 1;
    
    -- If reference amount exists and current amount exceeds it
    IF reference_amount IS NOT NULL AND NEW.amount > reference_amount THEN
      -- Calculate percentage over reference (with safe division)
      IF reference_amount > 0 THEN
        percentage_over := ((NEW.amount - reference_amount) / reference_amount * 100);
        
        -- Cap the percentage at a reasonable maximum to prevent overflow
        IF percentage_over > 9999.99 THEN
          percentage_over := 9999.99;
        END IF;
        
        -- Only alert if over threshold
        IF percentage_over > alert_threshold THEN
          -- Get loft name if available
          SELECT l.name INTO loft_name
          FROM lofts l
          WHERE l.id = NEW.loft_id;
          
          -- Create notification for amount alert
          INSERT INTO notifications (
            user_id, title, message, type, link, created_at
          )
          SELECT 
            p.id,
            'Transaction Amount Alert',
            format('Transaction of %s exceeds reference amount of %s by %.2f%% for category "%s"%s',
              NEW.amount,
              reference_amount,
              percentage_over,
              category_name,
              CASE WHEN loft_name IS NOT NULL THEN format(' (Loft: %s)', loft_name) ELSE '' END
            ),
            'warning',
            format('/transactions/%s', NEW.id),
            NOW()
          FROM profiles p
          WHERE p.role IN ('admin', 'manager');
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_check_transaction_amount ON transactions;
CREATE TRIGGER trigger_check_transaction_amount
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_transaction_amount_vs_reference();

-- Also update the view function to handle larger percentages and use the helper function
CREATE OR REPLACE FUNCTION get_transaction_amount_alerts(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  transaction_id UUID,
  loft_id UUID,
  amount DECIMAL(10,2),
  category VARCHAR(100),
  reference_amount DECIMAL(10,2),
  percentage_over DECIMAL(10,2), -- Changed from DECIMAL(5,2) to DECIMAL(10,2)
  description TEXT,
  loft_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.loft_id,
    t.amount,
    get_transaction_category(t.description) as category,
    tcr.reference_amount,
    LEAST(((t.amount - tcr.reference_amount) / tcr.reference_amount * 100), 9999.99)::DECIMAL(10,2) as percentage_over, -- Cap at 9999.99%
    t.description,
    l.name as loft_name,
    t.created_at
  FROM transactions t
  LEFT JOIN lofts l ON t.loft_id = l.id
  JOIN transaction_category_references tcr ON (
    tcr.category = get_transaction_category(t.description)
    AND tcr.transaction_type = 'expense'
  )
  WHERE t.amount > tcr.reference_amount
  AND t.created_at >= NOW() - INTERVAL '1 day' * days_back
  AND ((t.amount - tcr.reference_amount) / tcr.reference_amount * 100) > 20.00
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_transaction_category(TEXT) IS 'Helper function to determine transaction category from its description.';
COMMENT ON FUNCTION check_transaction_amount_vs_reference() IS 'Fixed DECIMAL precision overflow by changing from DECIMAL(5,2) to DECIMAL(10,2) and refactored to use get_transaction_category helper function.';
COMMENT ON FUNCTION get_transaction_amount_alerts(INTEGER) IS 'Fixed DECIMAL precision overflow by changing from DECIMAL(5,2) to DECIMAL(10,2) and refactored to use get_transaction_category helper function.';
