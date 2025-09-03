ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ratio_at_transaction NUMERIC,
ADD COLUMN IF NOT EXISTS equivalent_amount_default_currency NUMERIC;
