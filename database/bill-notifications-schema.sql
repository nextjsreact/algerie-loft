-- Bill Notifications Database Schema
-- This creates the necessary functions and triggers for automatic bill due date management

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(due_date DATE, frequency TEXT)
RETURNS DATE AS $$
BEGIN
  CASE LOWER(frequency)
    WHEN 'monthly' THEN
      RETURN due_date + INTERVAL '1 month';
    WHEN 'mensuel' THEN
      RETURN due_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN due_date + INTERVAL '3 months';
    WHEN 'trimestriel' THEN
      RETURN due_date + INTERVAL '3 months';
    WHEN 'semi-annual' THEN
      RETURN due_date + INTERVAL '6 months';
    WHEN 'semestriel' THEN
      RETURN due_date + INTERVAL '6 months';
    WHEN 'annual' THEN
      RETURN due_date + INTERVAL '1 year';
    WHEN 'annuel' THEN
      RETURN due_date + INTERVAL '1 year';
    WHEN 'bi-monthly' THEN
      RETURN due_date + INTERVAL '2 months';
    WHEN 'bimestriel' THEN
      RETURN due_date + INTERVAL '2 months';
    ELSE
      -- Default to monthly if frequency is not recognized
      RETURN due_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update next bill dates when a bill is marked as paid
CREATE OR REPLACE FUNCTION update_next_bill_dates()
RETURNS TRIGGER AS $$
DECLARE
  loft_record RECORD;
  utility_types TEXT[] := ARRAY['eau', 'energie', 'telephone', 'internet'];
  utility_type TEXT;
  current_due_date DATE;
  frequency_value TEXT;
  next_due_date DATE;
BEGIN
  -- Only process if this is a bill payment transaction
  IF NEW.transaction_type = 'expense' AND 
     NEW.status = 'completed' AND 
     NEW.category IN ('water', 'energy', 'phone', 'internet', 'eau', 'energie', 'telephone') AND
     NEW.loft_id IS NOT NULL THEN
    
    -- Get the loft information
    SELECT * INTO loft_record FROM lofts WHERE id = NEW.loft_id;
    
    IF FOUND THEN
      -- Map transaction category to utility type
      utility_type := CASE 
        WHEN NEW.category IN ('water', 'eau') THEN 'eau'
        WHEN NEW.category IN ('energy', 'energie') THEN 'energie'
        WHEN NEW.category IN ('phone', 'telephone') THEN 'telephone'
        WHEN NEW.category = 'internet' THEN 'internet'
        ELSE NULL
      END;
      
      IF utility_type IS NOT NULL THEN
        -- Get current due date and frequency
        EXECUTE format('SELECT $1.prochaine_echeance_%s, $1.frequence_paiement_%s', 
                      utility_type, utility_type) 
        INTO current_due_date, frequency_value 
        USING loft_record;
        
        -- Calculate next due date if we have the required information
        IF current_due_date IS NOT NULL AND frequency_value IS NOT NULL THEN
          next_due_date := calculate_next_due_date(current_due_date, frequency_value);
          
          -- Update the next due date
          EXECUTE format('UPDATE lofts SET prochaine_echeance_%s = $1 WHERE id = $2', 
                        utility_type) 
          USING next_due_date, NEW.loft_id;
          
          -- Log the update
          RAISE NOTICE 'Updated next due date for % bill in loft %: %', 
                      utility_type, NEW.loft_id, next_due_date;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update bill dates when payments are made
DROP TRIGGER IF EXISTS trigger_update_bill_dates ON transactions;
CREATE TRIGGER trigger_update_bill_dates
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_next_bill_dates();

-- Function to get upcoming bill due dates (for dashboard/reports)
CREATE OR REPLACE FUNCTION get_upcoming_bills(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  loft_id UUID,
  loft_name VARCHAR(255),
  owner_id UUID,
  utility_type VARCHAR(50),
  due_date DATE,
  frequency VARCHAR(50),
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH bill_data AS (
    SELECT 
      l.id as loft_id,
      l.name as loft_name,
      l.owner_id,
      'eau' as utility_type,
      l.prochaine_echeance_eau as due_date,
      l.frequence_paiement_eau as frequency
    FROM lofts l
    WHERE l.prochaine_echeance_eau IS NOT NULL 
      AND l.frequence_paiement_eau IS NOT NULL
      AND l.prochaine_echeance_eau <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'energie',
      l.prochaine_echeance_energie,
      l.frequence_paiement_energie
    FROM lofts l
    WHERE l.prochaine_echeance_energie IS NOT NULL 
      AND l.frequence_paiement_energie IS NOT NULL
      AND l.prochaine_echeance_energie <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'telephone',
      l.prochaine_echeance_telephone,
      l.frequence_paiement_telephone
    FROM lofts l
    WHERE l.prochaine_echeance_telephone IS NOT NULL 
      AND l.frequence_paiement_telephone IS NOT NULL
      AND l.prochaine_echeance_telephone <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'internet',
      l.prochaine_echeance_internet,
      l.frequence_paiement_internet
    FROM lofts l
    WHERE l.prochaine_echeance_internet IS NOT NULL 
      AND l.frequence_paiement_internet IS NOT NULL
      AND l.prochaine_echeance_internet <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
  )
  SELECT 
    bd.loft_id,
    bd.loft_name,
    bd.owner_id,
    bd.utility_type,
    bd.due_date,
    bd.frequency,
    (bd.due_date - CURRENT_DATE)::INTEGER as days_until_due
  FROM bill_data bd
  ORDER BY bd.due_date ASC, bd.loft_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get overdue bills
CREATE OR REPLACE FUNCTION get_overdue_bills()
RETURNS TABLE(
  loft_id UUID,
  loft_name TEXT,
  owner_id UUID,
  utility_type TEXT,
  due_date DATE,
  frequency TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH overdue_data AS (
    SELECT 
      l.id as loft_id,
      l.name as loft_name,
      l.owner_id,
      'eau' as utility_type,
      l.prochaine_echeance_eau as due_date,
      l.frequence_paiement_eau as frequency
    FROM lofts l
    WHERE l.prochaine_echeance_eau IS NOT NULL 
      AND l.frequence_paiement_eau IS NOT NULL
      AND l.prochaine_echeance_eau < CURRENT_DATE
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'energie',
      l.prochaine_echeance_energie,
      l.frequence_paiement_energie
    FROM lofts l
    WHERE l.prochaine_echeance_energie IS NOT NULL 
      AND l.frequence_paiement_energie IS NOT NULL
      AND l.prochaine_echeance_energie < CURRENT_DATE
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'telephone',
      l.prochaine_echeance_telephone,
      l.frequence_paiement_telephone
    FROM lofts l
    WHERE l.prochaine_echeance_telephone IS NOT NULL 
      AND l.frequence_paiement_telephone IS NOT NULL
      AND l.prochaine_echeance_telephone < CURRENT_DATE
    
    UNION ALL
    
    SELECT 
      l.id,
      l.name,
      l.owner_id,
      'internet',
      l.prochaine_echeance_internet,
      l.frequence_paiement_internet
    FROM lofts l
    WHERE l.prochaine_echeance_internet IS NOT NULL 
      AND l.frequence_paiement_internet IS NOT NULL
      AND l.prochaine_echeance_internet < CURRENT_DATE
  )
  SELECT 
    od.loft_id,
    od.loft_name,
    od.owner_id,
    od.utility_type,
    od.due_date,
    od.frequency,
    (CURRENT_DATE - od.due_date)::INTEGER as days_overdue
  FROM overdue_data od
  ORDER BY od.due_date ASC, od.loft_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_next_bill_dates() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_bills(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_overdue_bills() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lofts_eau_due_date ON lofts(prochaine_echeance_eau) WHERE prochaine_echeance_eau IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_energie_due_date ON lofts(prochaine_echeance_energie) WHERE prochaine_echeance_energie IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_telephone_due_date ON lofts(prochaine_echeance_telephone) WHERE prochaine_echeance_telephone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_internet_due_date ON lofts(prochaine_echeance_internet) WHERE prochaine_echeance_internet IS NOT NULL;

SELECT 'Bill notifications schema created successfully!' as status;