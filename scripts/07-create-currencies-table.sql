-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(3) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  ratio DECIMAL(18, 8) NOT NULL DEFAULT 1.0, -- Exchange rate relative to the default currency
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on code field
CREATE INDEX IF NOT EXISTS currencies_code_idx ON currencies (code);

-- Add RLS policy for currencies
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Admin can do anything with currencies
CREATE POLICY admin_all_currencies ON currencies
  FOR ALL
  TO admin
  USING (true);

-- Managers can view currencies but not modify
CREATE POLICY manager_view_currencies ON currencies
  FOR SELECT
  TO manager
  USING (true);

-- Members can view currencies but not modify
CREATE POLICY member_view_currencies ON currencies
  FOR SELECT
  TO member
  USING (true);
