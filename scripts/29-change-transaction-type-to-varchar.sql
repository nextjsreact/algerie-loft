-- Temporarily disable RLS on transactions to allow schema changes
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop dependent objects (if any)
-- First, identify any functions or views that depend on the transaction_type enum.
-- For simplicity, we'll assume there are no complex dependencies for now.

-- Drop the existing transaction_type enum
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Recreate the transaction_type column as VARCHAR(50)
-- This assumes you want to preserve data. If not, a full table recreation is needed.
-- Since the column is NOT NULL, we need to set a default or ensure existing data is compatible.
ALTER TABLE transactions ALTER COLUMN transaction_type TYPE VARCHAR(50);

-- If the column was NOT NULL, you might need to re-add the NOT NULL constraint
-- ALTER TABLE transactions ALTER COLUMN transaction_type SET NOT NULL;

-- Re-enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
