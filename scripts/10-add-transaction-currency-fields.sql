ALTER TABLE transactions
ADD COLUMN ratio_at_transaction DECIMAL(18, 8),
ADD COLUMN equivalent_amount_default_currency DECIMAL(18, 2);
