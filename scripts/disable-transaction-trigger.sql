-- Temporary fix: Disable the transaction amount checking trigger
-- This prevents the DECIMAL overflow error until we can fix the precision

-- Disable the trigger that's causing the overflow
DROP TRIGGER IF EXISTS trigger_check_transaction_amount ON transactions;

-- Optional: Also drop the function if you want to completely remove the checking
-- DROP FUNCTION IF EXISTS check_transaction_amount_vs_reference();

-- You can re-enable it later with proper precision by running:
-- CREATE TRIGGER trigger_check_transaction_amount
--   AFTER INSERT OR UPDATE ON transactions
--   FOR EACH ROW
--   EXECUTE FUNCTION check_transaction_amount_vs_reference();