-- =====================================================
-- VISITOR TRACKING SYSTEM
-- =====================================================
-- This schema tracks website visitors for analytics

-- Create visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50), -- mobile, tablet, desktop
    browser VARCHAR(100),
    os VARCHAR(100),
    first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_views table for detailed tracking
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    duration_seconds INTEGER, -- time spent on page
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON public.visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_first_visit ON public.visitors(first_visit);
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON public.visitors(last_visit);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON public.visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON public.page_views(viewed_at);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public insert for tracking, superuser read
CREATE POLICY "Allow public insert for visitor tracking"
    ON public.visitors
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public insert for page view tracking"
    ON public.page_views
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Superusers can view all visitors"
    ON public.visitors
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM superuser_profiles
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Superusers can view all page views"
    ON public.page_views
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM superuser_profiles
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Function to get visitor statistics
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS TABLE (
    total_visitors BIGINT,
    today_visitors BIGINT,
    unique_today BIGINT,
    total_page_views BIGINT,
    today_page_views BIGINT,
    avg_session_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total unique visitors (all time)
        COUNT(DISTINCT v.id)::BIGINT as total_visitors,
        
        -- Total visitors today (including returning)
        COUNT(DISTINCT CASE 
            WHEN v.last_visit::date = CURRENT_DATE 
            THEN v.id 
        END)::BIGINT as today_visitors,
        
        -- New unique visitors today
        COUNT(DISTINCT CASE 
            WHEN v.first_visit::date = CURRENT_DATE 
            THEN v.id 
        END)::BIGINT as unique_today,
        
        -- Total page views (all time)
        (SELECT COUNT(*)::BIGINT FROM page_views) as total_page_views,
        
        -- Page views today
        (SELECT COUNT(*)::BIGINT FROM page_views 
         WHERE viewed_at::date = CURRENT_DATE) as today_page_views,
        
        -- Average session duration in seconds
        COALESCE(
            (SELECT AVG(duration_seconds)::NUMERIC 
             FROM page_views 
             WHERE duration_seconds IS NOT NULL),
            0
        ) as avg_session_duration
    FROM visitors v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visitor trends (last 7 days)
CREATE OR REPLACE FUNCTION get_visitor_trends()
RETURNS TABLE (
    date DATE,
    new_visitors BIGINT,
    returning_visitors BIGINT,
    total_page_views BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date::DATE,
        COUNT(DISTINCT CASE 
            WHEN v.first_visit::date = d.date 
            THEN v.id 
        END)::BIGINT as new_visitors,
        COUNT(DISTINCT CASE 
            WHEN v.last_visit::date = d.date 
            AND v.first_visit::date < d.date 
            THEN v.id 
        END)::BIGINT as returning_visitors,
        COUNT(pv.id)::BIGINT as total_page_views
    FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'::interval
    ) d(date)
    LEFT JOIN visitors v ON v.last_visit::date = d.date::date
    LEFT JOIN page_views pv ON pv.viewed_at::date = d.date::date
    GROUP BY d.date
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record or update visitor
CREATE OR REPLACE FUNCTION record_visitor(
    p_session_id VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_landing_page TEXT DEFAULT NULL,
    p_device_type VARCHAR(50) DEFAULT NULL,
    p_browser VARCHAR(100) DEFAULT NULL,
    p_os VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_visitor_id UUID;
BEGIN
    -- Check if visitor exists
    SELECT id INTO v_visitor_id
    FROM visitors
    WHERE session_id = p_session_id;
    
    IF v_visitor_id IS NULL THEN
        -- New visitor
        INSERT INTO visitors (
            session_id,
            ip_address,
            user_agent,
            referrer,
            landing_page,
            device_type,
            browser,
            os,
            first_visit,
            last_visit,
            visit_count
        ) VALUES (
            p_session_id,
            p_ip_address,
            p_user_agent,
            p_referrer,
            p_landing_page,
            p_device_type,
            p_browser,
            p_os,
            NOW(),
            NOW(),
            1
        )
        RETURNING id INTO v_visitor_id;
    ELSE
        -- Returning visitor
        UPDATE visitors
        SET 
            last_visit = NOW(),
            visit_count = visit_count + 1,
            updated_at = NOW()
        WHERE id = v_visitor_id;
    END IF;
    
    RETURN v_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_visitor_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_visitor_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION record_visitor(VARCHAR, INET, TEXT, TEXT, TEXT, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;

-- Comments
COMMENT ON TABLE public.visitors IS 'Tracks unique website visitors';
COMMENT ON TABLE public.page_views IS 'Tracks individual page views';
COMMENT ON FUNCTION get_visitor_stats() IS 'Returns visitor statistics for dashboard';
COMMENT ON FUNCTION get_visitor_trends() IS 'Returns visitor trends for the last 7 days';
COMMENT ON FUNCTION record_visitor(VARCHAR, INET, TEXT, TEXT, TEXT, VARCHAR, VARCHAR, VARCHAR) IS 'Records or updates a visitor session';
