-- Transaction Reference Amounts Schema
-- This creates reference amounts for transaction categories and alerts when amounts exceed references

-- Drop existing table and functions if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_check_transaction_amount ON transactions;
DROP FUNCTION IF EXISTS check_transaction_amount_vs_reference();
DROP FUNCTION IF EXISTS get_transaction_category_references();
DROP FUNCTION IF EXISTS update_transaction_reference_amount(VARCHAR, VARCHAR, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_transactions_over_reference(INTEGER);
DROP TABLE IF EXISTS transaction_category_references;

-- Create table for transaction category reference amounts
CREATE TABLE transaction_category_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  reference_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'DZD',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, transaction_type)
);

-- Insert default reference amounts for common transaction categories
INSERT INTO transaction_category_references (category, transaction_type, reference_amount, description) VALUES
-- Expense categories
('maintenance', 'expense', 5000.00, 'Maintenance générale des lofts'),
('cleaning', 'expense', 2000.00, 'Nettoyage et entretien'),
('repair', 'expense', 8000.00, 'Réparations diverses'),
('plumbing', 'expense', 6000.00, 'Plomberie'),
('electrical', 'expense', 7000.00, 'Électricité'),
('painting', 'expense', 4000.00, 'Peinture et décoration'),
('security', 'expense', 3000.00, 'Sécurité'),
('inspection', 'expense', 1500.00, 'Inspections'),
('utilities', 'expense', 4000.00, 'Factures utilitaires (eau, gaz, électricité)'),
('insurance', 'expense', 10000.00, 'Assurances'),
('taxes', 'expense', 15000.00, 'Taxes et impôts'),
('supplies', 'expense', 2500.00, 'Fournitures et matériaux'),
('other', 'expense', 3000.00, 'Autres dépenses'),

-- Income categories
('rent', 'income', 50000.00, 'Loyers mensuels'),
('deposit', 'income', 100000.00, 'Cautions et dépôts'),
('late_fees', 'income', 5000.00, 'Frais de retard'),
('parking', 'income', 5000.00, 'Frais de parking'),
('services', 'income', 10000.00, 'Services additionnels'),
('other', 'income', 20000.00, 'Autres revenus');

-- Function to check if transaction amount exceeds reference
CREATE OR REPLACE FUNCTION check_transaction_amount_vs_reference()
RETURNS TRIGGER AS $$
DECLARE
  reference_amount DECIMAL(10,2);
  category_name VARCHAR(100);
  percentage_over DECIMAL(5,2);
  alert_threshold DECIMAL(5,2) := 20.00; -- Alert if 20% over reference
  loft_name TEXT;
BEGIN
  -- Only check if amount is provided and > 0
  IF NEW.amount IS NOT NULL AND NEW.amount > 0 THEN
    
    -- Get category from transaction description or use 'other' as default
    category_name := COALESCE(
      CASE 
        WHEN LOWER(NEW.description) LIKE '%maintenance%' THEN 'maintenance'
        WHEN LOWER(NEW.description) LIKE '%cleaning%' OR LOWER(NEW.description) LIKE '%nettoyage%' THEN 'cleaning'
        WHEN LOWER(NEW.description) LIKE '%repair%' OR LOWER(NEW.description) LIKE '%réparation%' THEN 'repair'
        WHEN LOWER(NEW.description) LIKE '%plumbing%' OR LOWER(NEW.description) LIKE '%plomberie%' THEN 'plumbing'
        WHEN LOWER(NEW.description) LIKE '%electrical%' OR LOWER(NEW.description) LIKE '%électricité%' THEN 'electrical'
        WHEN LOWER(NEW.description) LIKE '%painting%' OR LOWER(NEW.description) LIKE '%peinture%' THEN 'painting'
        WHEN LOWER(NEW.description) LIKE '%security%' OR LOWER(NEW.description) LIKE '%sécurité%' THEN 'security'
        WHEN LOWER(NEW.description) LIKE '%inspection%' THEN 'inspection'
        WHEN LOWER(NEW.description) LIKE '%utilities%' OR LOWER(NEW.description) LIKE '%facture%' THEN 'utilities'
        WHEN LOWER(NEW.description) LIKE '%insurance%' OR LOWER(NEW.description) LIKE '%assurance%' THEN 'insurance'
        WHEN LOWER(NEW.description) LIKE '%tax%' OR LOWER(NEW.description) LIKE '%impôt%' THEN 'taxes'
        WHEN LOWER(NEW.description) LIKE '%supplies%' OR LOWER(NEW.description) LIKE '%fourniture%' THEN 'supplies'
        WHEN LOWER(NEW.description) LIKE '%rent%' OR LOWER(NEW.description) LIKE '%loyer%' THEN 'rent'
        WHEN LOWER(NEW.description) LIKE '%deposit%' OR LOWER(NEW.description) LIKE '%caution%' THEN 'deposit'
        WHEN LOWER(NEW.description) LIKE '%late%' OR LOWER(NEW.description) LIKE '%retard%' THEN 'late_fees'
        WHEN LOWER(NEW.description) LIKE '%parking%' THEN 'parking'
        WHEN LOWER(NEW.description) LIKE '%service%' THEN 'services'
        ELSE 'other'
      END,
      'other'
    );
    
    -- Get reference amount for this category and transaction type
    SELECT tcr.reference_amount INTO reference_amount
    FROM transaction_category_references tcr
    WHERE tcr.category = category_name AND tcr.transaction_type = NEW.transaction_type::VARCHAR;
    
    -- If reference found, check if amount exceeds threshold
    IF reference_amount IS NOT NULL AND reference_amount > 0 THEN
      percentage_over := ((NEW.amount - reference_amount) / reference_amount) * 100;
      
      -- If amount exceeds reference by more than threshold, create notification
      IF percentage_over > alert_threshold THEN
        
        -- Get loft name if available
        SELECT l.name INTO loft_name FROM lofts l WHERE l.id = NEW.loft_id;
        
        -- Insert notification for admins and managers
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          link,
          is_read,
          created_at
        )
        SELECT 
          p.id as user_id,
          '💰 Montant de Transaction Élevé' as title,
          format('Transaction "%s" (%s) - Montant: %s %s (%.1f%% au-dessus de la référence %s %s) - Loft: %s',
            COALESCE(NEW.description, 'Transaction'),
            CASE NEW.transaction_type WHEN 'expense' THEN 'Dépense' ELSE 'Revenu' END,
            NEW.amount,
            COALESCE(NEW.currency_id, 'DZD'),
            percentage_over,
            reference_amount,
            COALESCE(NEW.currency_id, 'DZD'),
            COALESCE(loft_name, 'Non spécifié')
          ) as message,
          'warning' as type,
          format('/transactions/%s', NEW.id) as link,
          false as is_read,
          NOW() as created_at
        FROM profiles p
        WHERE p.role IN ('admin', 'manager');
        
        -- Log the alert
        RAISE NOTICE 'Transaction amount alert: Transaction % has amount % which is %.1f%% over reference % for category % (%)',
          NEW.id, NEW.amount, percentage_over, reference_amount, category_name, NEW.transaction_type;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction amount checking
CREATE TRIGGER trigger_check_transaction_amount
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_transaction_amount_vs_reference();

-- Function to get transaction category references
CREATE OR REPLACE FUNCTION get_transaction_category_references()
RETURNS TABLE(
  category VARCHAR(100),
  transaction_type VARCHAR(20),
  reference_amount DECIMAL(10,2),
  currency VARCHAR(10),
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tcr.category,
    tcr.transaction_type,
    tcr.reference_amount,
    tcr.currency,
    tcr.description
  FROM transaction_category_references tcr
  ORDER BY tcr.transaction_type, tcr.category;
END;
$$ LANGUAGE plpgsql;

-- Function to update reference amount for a category
CREATE OR REPLACE FUNCTION update_transaction_reference_amount(
  category_name VARCHAR(100),
  trans_type VARCHAR(20),
  new_amount DECIMAL(10,2),
  new_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE transaction_category_references 
  SET 
    reference_amount = new_amount,
    description = COALESCE(new_description, description),
    updated_at = NOW()
  WHERE category = category_name AND transaction_type = trans_type;
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    -- Insert new category if it doesn't exist
    INSERT INTO transaction_category_references (category, transaction_type, reference_amount, description)
    VALUES (category_name, trans_type, new_amount, COALESCE(new_description, 'Nouvelle catégorie'));
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get transactions that exceeded reference amounts
CREATE OR REPLACE FUNCTION get_transactions_over_reference(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  transaction_id UUID,
  description TEXT,
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  transaction_type VARCHAR(20),
  category VARCHAR(100),
  reference_amount DECIMAL(10,2),
  percentage_over DECIMAL(5,2),
  loft_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH categorized_transactions AS (
    SELECT 
      t.id as transaction_id,
      t.description,
      t.amount,
      COALESCE(t.currency_id, 'DZD') as currency,
      t.transaction_type,
      t.created_at,
      l.name as loft_name,
      CASE 
        WHEN LOWER(t.description) LIKE '%maintenance%' THEN 'maintenance'
        WHEN LOWER(t.description) LIKE '%cleaning%' OR LOWER(t.description) LIKE '%nettoyage%' THEN 'cleaning'
        WHEN LOWER(t.description) LIKE '%repair%' OR LOWER(t.description) LIKE '%réparation%' THEN 'repair'
        WHEN LOWER(t.description) LIKE '%plumbing%' OR LOWER(t.description) LIKE '%plomberie%' THEN 'plumbing'
        WHEN LOWER(t.description) LIKE '%electrical%' OR LOWER(t.description) LIKE '%électricité%' THEN 'electrical'
        WHEN LOWER(t.description) LIKE '%painting%' OR LOWER(t.description) LIKE '%peinture%' THEN 'painting'
        WHEN LOWER(t.description) LIKE '%security%' OR LOWER(t.description) LIKE '%sécurité%' THEN 'security'
        WHEN LOWER(t.description) LIKE '%inspection%' THEN 'inspection'
        WHEN LOWER(t.description) LIKE '%utilities%' OR LOWER(t.description) LIKE '%facture%' THEN 'utilities'
        WHEN LOWER(t.description) LIKE '%insurance%' OR LOWER(t.description) LIKE '%assurance%' THEN 'insurance'
        WHEN LOWER(t.description) LIKE '%tax%' OR LOWER(t.description) LIKE '%impôt%' THEN 'taxes'
        WHEN LOWER(t.description) LIKE '%supplies%' OR LOWER(t.description) LIKE '%fourniture%' THEN 'supplies'
        WHEN LOWER(t.description) LIKE '%rent%' OR LOWER(t.description) LIKE '%loyer%' THEN 'rent'
        WHEN LOWER(t.description) LIKE '%deposit%' OR LOWER(t.description) LIKE '%caution%' THEN 'deposit'
        WHEN LOWER(t.description) LIKE '%late%' OR LOWER(t.description) LIKE '%retard%' THEN 'late_fees'
        WHEN LOWER(t.description) LIKE '%parking%' THEN 'parking'
        WHEN LOWER(t.description) LIKE '%service%' THEN 'services'
        ELSE 'other'
      END as category
    FROM transactions t
    LEFT JOIN lofts l ON l.id = t.loft_id
    WHERE t.amount IS NOT NULL 
      AND t.amount > 0
      AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  )
  SELECT 
    ct.transaction_id,
    ct.description,
    ct.amount,
    ct.currency,
    ct.transaction_type,
    ct.category,
    tcr.reference_amount,
    ((ct.amount - tcr.reference_amount) / tcr.reference_amount * 100)::DECIMAL(5,2) as percentage_over,
    ct.loft_name,
    ct.created_at
  FROM categorized_transactions ct
  JOIN transaction_category_references tcr ON (
    tcr.category = ct.category AND 
    tcr.transaction_type = ct.transaction_type
  )
  WHERE ct.amount > (tcr.reference_amount * 1.2)
  ORDER BY ct.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON transaction_category_references TO authenticated;
GRANT EXECUTE ON FUNCTION check_transaction_amount_vs_reference() TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_category_references() TO authenticated;
GRANT EXECUTE ON FUNCTION update_transaction_reference_amount(VARCHAR, VARCHAR, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transactions_over_reference(INTEGER) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_category_references_category_type ON transaction_category_references(category, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount) WHERE amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type_amount ON transactions(transaction_type, amount) WHERE amount IS NOT NULL;

SELECT 'Transaction reference amounts schema created successfully!' as status;
