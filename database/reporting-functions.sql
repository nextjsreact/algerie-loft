-- Reporting Functions for Multi-Role Booking System
-- These functions support the comprehensive reporting system

-- Function to get booking financial statistics
CREATE OR REPLACE FUNCTION get_booking_financial_stats(
  period_type TEXT DEFAULT 'monthly',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_bookings BIGINT,
  total_revenue DECIMAL(10,2),
  average_booking_value DECIMAL(10,2),
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  completed_bookings BIGINT
) AS $$
DECLARE
  default_start_date TIMESTAMP WITH TIME ZONE;
  default_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided
  default_end_date := COALESCE(end_date, NOW());
  default_start_date := COALESCE(start_date, 
    CASE 
      WHEN period_type = 'daily' THEN default_end_date - INTERVAL '1 day'
      WHEN period_type = 'weekly' THEN default_end_date - INTERVAL '1 week'
      WHEN period_type = 'monthly' THEN default_end_date - INTERVAL '1 month'
      WHEN period_type = 'yearly' THEN default_end_date - INTERVAL '1 year'
      ELSE default_end_date - INTERVAL '1 month'
    END
  );

  RETURN QUERY
  SELECT 
    COUNT(*) as total_bookings,
    COALESCE(SUM(b.total_price), 0)::DECIMAL(10,2) as total_revenue,
    COALESCE(AVG(b.total_price), 0)::DECIMAL(10,2) as average_booking_value,
    COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
    COUNT(*) FILTER (WHERE b.status = 'completed') as completed_bookings
  FROM bookings b
  WHERE b.created_at >= default_start_date 
    AND b.created_at <= default_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner performance statistics
CREATE OR REPLACE FUNCTION get_partner_performance_stats(
  partner_id UUID DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  total_properties BIGINT,
  active_properties BIGINT,
  total_bookings BIGINT,
  total_revenue DECIMAL(10,2),
  average_rating DECIMAL(3,2),
  occupancy_rate DECIMAL(5,2)
) AS $$
DECLARE
  default_start_date TIMESTAMP WITH TIME ZONE;
  default_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided (last 30 days)
  default_end_date := COALESCE(end_date, NOW());
  default_start_date := COALESCE(start_date, default_end_date - INTERVAL '30 days');

  RETURN QUERY
  SELECT 
    p.id as partner_id,
    p.full_name as partner_name,
    COUNT(DISTINCT l.id) as total_properties,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true) as active_properties,
    COUNT(b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0)::DECIMAL(10,2) as total_revenue,
    COALESCE(AVG(lr.rating), 0)::DECIMAL(3,2) as average_rating,
    CASE 
      WHEN COUNT(DISTINCT l.id) > 0 THEN 
        (COUNT(b.id)::DECIMAL / COUNT(DISTINCT l.id) * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as occupancy_rate
  FROM profiles p
  LEFT JOIN lofts l ON l.partner_id = p.id
  LEFT JOIN bookings b ON b.partner_id = p.id 
    AND b.created_at >= default_start_date 
    AND b.created_at <= default_end_date
  LEFT JOIN loft_reviews lr ON lr.loft_id = l.id
  WHERE p.role = 'partner'
    AND (partner_id IS NULL OR p.id = partner_id)
  GROUP BY p.id, p.full_name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client activity statistics
CREATE OR REPLACE FUNCTION get_client_activity_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_clients BIGINT,
  active_clients BIGINT,
  new_clients BIGINT,
  repeat_clients BIGINT,
  average_bookings_per_client DECIMAL(5,2),
  client_retention_rate DECIMAL(5,2)
) AS $$
DECLARE
  default_start_date TIMESTAMP WITH TIME ZONE;
  default_end_date TIMESTAMP WITH TIME ZONE;
  previous_period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided (last 30 days)
  default_end_date := COALESCE(end_date, NOW());
  default_start_date := COALESCE(start_date, default_end_date - INTERVAL '30 days');
  previous_period_start := default_start_date - (default_end_date - default_start_date);

  RETURN QUERY
  WITH client_stats AS (
    SELECT 
      p.id,
      p.created_at,
      COUNT(b.id) as booking_count,
      COUNT(b.id) FILTER (WHERE b.created_at >= default_start_date AND b.created_at <= default_end_date) as period_bookings,
      COUNT(b.id) FILTER (WHERE b.created_at >= previous_period_start AND b.created_at < default_start_date) as previous_period_bookings
    FROM profiles p
    LEFT JOIN bookings b ON b.client_id = p.id
    WHERE p.role = 'client'
    GROUP BY p.id, p.created_at
  )
  SELECT 
    COUNT(*) as total_clients,
    COUNT(*) FILTER (WHERE period_bookings > 0) as active_clients,
    COUNT(*) FILTER (WHERE created_at >= default_start_date AND created_at <= default_end_date) as new_clients,
    COUNT(*) FILTER (WHERE booking_count > 1) as repeat_clients,
    COALESCE(AVG(period_bookings), 0)::DECIMAL(5,2) as average_bookings_per_client,
    CASE 
      WHEN COUNT(*) FILTER (WHERE previous_period_bookings > 0) > 0 THEN
        (COUNT(*) FILTER (WHERE period_bookings > 0 AND previous_period_bookings > 0)::DECIMAL / 
         COUNT(*) FILTER (WHERE previous_period_bookings > 0) * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as client_retention_rate
  FROM client_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_properties BIGINT,
  active_properties BIGINT,
  total_bookings BIGINT,
  total_revenue DECIMAL(10,2),
  average_occupancy_rate DECIMAL(5,2),
  total_disputes BIGINT,
  resolved_disputes BIGINT,
  dispute_resolution_rate DECIMAL(5,2),
  platform_growth_rate DECIMAL(5,2)
) AS $$
DECLARE
  default_start_date TIMESTAMP WITH TIME ZONE;
  default_end_date TIMESTAMP WITH TIME ZONE;
  previous_period_start TIMESTAMP WITH TIME ZONE;
  previous_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided (last 30 days)
  default_end_date := COALESCE(end_date, NOW());
  default_start_date := COALESCE(start_date, default_end_date - INTERVAL '30 days');
  
  -- Calculate previous period for growth comparison
  previous_period_end := default_start_date;
  previous_period_start := previous_period_end - (default_end_date - default_start_date);

  RETURN QUERY
  WITH current_period AS (
    SELECT 
      COUNT(DISTINCT l.id) as properties,
      COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true) as active_props,
      COUNT(b.id) as bookings,
      COALESCE(SUM(b.total_price), 0) as revenue
    FROM lofts l
    LEFT JOIN bookings b ON b.loft_id = l.id 
      AND b.created_at >= default_start_date 
      AND b.created_at <= default_end_date
  ),
  previous_period AS (
    SELECT 
      COUNT(b.id) as prev_bookings,
      COALESCE(SUM(b.total_price), 0) as prev_revenue
    FROM bookings b
    WHERE b.created_at >= previous_period_start 
      AND b.created_at < previous_period_end
  ),
  dispute_stats AS (
    SELECT 
      COUNT(*) as total_disp,
      COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_disp
    FROM booking_disputes
    WHERE created_at >= default_start_date 
      AND created_at <= default_end_date
  )
  SELECT 
    cp.properties as total_properties,
    cp.active_props as active_properties,
    cp.bookings as total_bookings,
    cp.revenue::DECIMAL(10,2) as total_revenue,
    CASE 
      WHEN cp.active_props > 0 THEN 
        (cp.bookings::DECIMAL / cp.active_props * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as average_occupancy_rate,
    ds.total_disp as total_disputes,
    ds.resolved_disp as resolved_disputes,
    CASE 
      WHEN ds.total_disp > 0 THEN 
        (ds.resolved_disp::DECIMAL / ds.total_disp * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as dispute_resolution_rate,
    CASE 
      WHEN pp.prev_revenue > 0 THEN 
        ((cp.revenue - pp.prev_revenue)::DECIMAL / pp.prev_revenue * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as platform_growth_rate
  FROM current_period cp
  CROSS JOIN previous_period pp
  CROSS JOIN dispute_stats ds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly trends data
CREATE OR REPLACE FUNCTION get_monthly_trends(
  months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
  month_year TEXT,
  month_date DATE,
  total_bookings BIGINT,
  total_revenue DECIMAL(10,2),
  new_users BIGINT,
  new_partners BIGINT,
  new_properties BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT 
      date_trunc('month', NOW() - (generate_series(0, months_back - 1) * INTERVAL '1 month')) as month_start
  ),
  monthly_data AS (
    SELECT 
      ms.month_start,
      to_char(ms.month_start, 'Mon YYYY') as month_label,
      ms.month_start::DATE as month_date,
      COUNT(DISTINCT b.id) as bookings,
      COALESCE(SUM(b.total_price), 0) as revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'client') as clients,
      COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'partner') as partners,
      COUNT(DISTINCT l.id) as properties
    FROM month_series ms
    LEFT JOIN bookings b ON date_trunc('month', b.created_at) = ms.month_start
    LEFT JOIN profiles p ON date_trunc('month', p.created_at) = ms.month_start
    LEFT JOIN lofts l ON date_trunc('month', l.created_at) = ms.month_start
    GROUP BY ms.month_start
    ORDER BY ms.month_start DESC
  )
  SELECT 
    md.month_label as month_year,
    md.month_date,
    md.bookings as total_bookings,
    md.revenue::DECIMAL(10,2) as total_revenue,
    md.clients as new_users,
    md.partners as new_partners,
    md.properties as new_properties
  FROM monthly_data md;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to appropriate roles
GRANT EXECUTE ON FUNCTION get_booking_financial_stats(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_performance_stats(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_activity_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_trends(INTEGER) TO authenticated;

-- Create RLS policies to restrict access to admin/manager roles only
CREATE POLICY "Only admins can access reporting functions" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'executive')
    )
  );

-- Create indexes for better performance on reporting queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_status ON bookings(created_at, status);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id_created_at ON bookings(partner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id_created_at ON bookings(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON profiles(role, created_at);
CREATE INDEX IF NOT EXISTS idx_lofts_partner_id_active ON lofts(partner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_type ON transactions(created_at, type);

COMMENT ON FUNCTION get_booking_financial_stats(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns financial statistics for bookings within a specified period';
COMMENT ON FUNCTION get_partner_performance_stats(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns performance statistics for partners';
COMMENT ON FUNCTION get_client_activity_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns activity statistics for clients';
COMMENT ON FUNCTION get_platform_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns overall platform analytics and performance metrics';
COMMENT ON FUNCTION get_monthly_trends(INTEGER) IS 'Returns monthly trend data for the specified number of months back';