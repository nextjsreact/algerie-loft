CREATE OR REPLACE FUNCTION public.calculate_loft_revenue()
RETURNS TABLE(name TEXT, revenue NUMERIC, expenses NUMERIC, net_profit NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.name,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0)::NUMERIC as revenue,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0)::NUMERIC as expenses,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END), 0)::NUMERIC as net_profit
  FROM lofts l
  LEFT JOIN transactions t ON l.id = t.loft_id AND t.status = 'completed'
  GROUP BY l.id, l.name
  ORDER BY net_profit DESC;
END;
$$ LANGUAGE plpgsql;
