-- Vérifier les vrais IDs et noms des devises dans votre base
SELECT 
    'CURRENCIES IN DATABASE' as section,
    id,
    code,
    name,
    symbol
FROM currencies
ORDER BY code;

-- Vérifier les devises utilisées dans les transactions récentes
SELECT 
    'CURRENCIES USED IN RECENT TRANSACTIONS' as section,
    c.id,
    c.code,
    c.name,
    COUNT(*) as usage_count
FROM transactions t
JOIN currencies c ON t.currency_id = c.id
WHERE t.updated_at >= NOW() - INTERVAL '7 days'
GROUP BY c.id, c.code, c.name
ORDER BY usage_count DESC;

-- Vérifier les devises dans les logs d'audit récents
SELECT 
    'CURRENCIES IN RECENT AUDIT LOGS' as section,
    DISTINCT jsonb_extract_path_text(old_values, 'currency_id') as old_currency_id,
    jsonb_extract_path_text(new_values, 'currency_id') as new_currency_id
FROM audit.audit_logs 
WHERE table_name = 'transactions' 
  AND 'currency_id' = ANY(changed_fields)
  AND timestamp >= NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC
LIMIT 10;