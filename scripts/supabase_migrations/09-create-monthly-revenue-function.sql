CREATE OR REPLACE FUNCTION calculate_monthly_revenue()
RETURNS TABLE(month TEXT, revenue NUMERIC, expenses NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month,
    SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END)::NUMERIC as revenue,
    SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END)::NUMERIC as expenses
  FROM transactions
  WHERE status = 'completed' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
  GROUP BY date_trunc('month', date)
  ORDER BY date_trunc('month', date);
END;
$$ LANGUAGE plpgsql;
