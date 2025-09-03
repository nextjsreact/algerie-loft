-- Fix for the update_next_bill_dates function that's causing the error
-- "could not identify column 'prochaine_echeance_energie' in record data type"

-- Drop the existing function
DROP FUNCTION IF EXISTS update_next_bill_dates() CASCADE;

-- Recreate the function with corrected logic
CREATE OR REPLACE FUNCTION update_next_bill_dates()
RETURNS TRIGGER AS $$
DECLARE
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

    -- Map transaction category to utility type
    utility_type := CASE
      WHEN NEW.category IN ('water', 'eau') THEN 'eau'
      WHEN NEW.category IN ('energy', 'energie') THEN 'energie'
      WHEN NEW.category IN ('phone', 'telephone') THEN 'telephone'
      WHEN NEW.category = 'internet' THEN 'internet'
      ELSE NULL
    END;

    IF utility_type IS NOT NULL THEN
      -- Get current due date and frequency using CASE expressions instead of dynamic SQL
      IF utility_type = 'eau' THEN
        SELECT prochaine_echeance_eau, frequence_paiement_eau 
        INTO current_due_date, frequency_value
        FROM lofts WHERE id = NEW.loft_id;
      ELSIF utility_type = 'energie' THEN
        SELECT prochaine_echeance_energie, frequence_paiement_energie 
        INTO current_due_date, frequency_value
        FROM lofts WHERE id = NEW.loft_id;
      ELSIF utility_type = 'telephone' THEN
        SELECT prochaine_echeance_telephone, frequence_paiement_telephone 
        INTO current_due_date, frequency_value
        FROM lofts WHERE id = NEW.loft_id;
      ELSIF utility_type = 'internet' THEN
        SELECT prochaine_echeance_internet, frequence_paiement_internet 
        INTO current_due_date, frequency_value
        FROM lofts WHERE id = NEW.loft_id;
      END IF;

      -- Calculate next due date if we have the required information
      IF current_due_date IS NOT NULL AND frequency_value IS NOT NULL THEN
        next_due_date := calculate_next_due_date(current_due_date, frequency_value);

        -- Update the next due date using separate conditions instead of dynamic SQL
        IF utility_type = 'eau' THEN
          UPDATE lofts SET prochaine_echeance_eau = next_due_date WHERE id = NEW.loft_id;
        ELSIF utility_type = 'energie' THEN
          UPDATE lofts SET prochaine_echeance_energie = next_due_date WHERE id = NEW.loft_id;
        ELSIF utility_type = 'telephone' THEN
          UPDATE lofts SET prochaine_echeance_telephone = next_due_date WHERE id = NEW.loft_id;
        ELSIF utility_type = 'internet' THEN
          UPDATE lofts SET prochaine_echeance_internet = next_due_date WHERE id = NEW.loft_id;
        END IF;

        -- Log the update
        RAISE NOTICE 'Updated next due date for % bill in loft %: %',
                    utility_type, NEW.loft_id, next_due_date;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_bill_dates ON transactions;
CREATE TRIGGER trigger_update_bill_dates
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_next_bill_dates();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_next_bill_dates() TO authenticated;
