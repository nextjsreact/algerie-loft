-- Script pour vérifier la conversion des devises dans les transactions
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Voir quelques transactions avec leurs montants et conversions
SELECT 
  id,
  amount,
  currency_id,
  ratio_at_transaction,
  equivalent_amount_default_currency,
  transaction_type,
  date,
  description
FROM transactions
ORDER BY date DESC
LIMIT 10;

-- 2. Compter les transactions par devise
SELECT 
  currency_id,
  COUNT(*) as transaction_count,
  COUNT(equivalent_amount_default_currency) as with_conversion,
  COUNT(CASE WHEN equivalent_amount_default_currency IS NULL THEN 1 END) as without_conversion
FROM transactions
GROUP BY currency_id
ORDER BY transaction_count DESC;

-- 3. Voir les transactions en devise étrangère sans conversion
SELECT 
  id,
  amount,
  currency_id,
  ratio_at_transaction,
  equivalent_amount_default_currency,
  transaction_type,
  description
FROM transactions
WHERE currency_id IS NOT NULL 
  AND currency_id != (SELECT id FROM currencies WHERE is_default = true LIMIT 1)
  AND equivalent_amount_default_currency IS NULL
LIMIT 10;

-- 4. Vérifier les devises et leurs ratios
SELECT 
  id,
  code,
  name,
  symbol,
  ratio,
  is_default
FROM currencies
ORDER BY is_default DESC, code;
