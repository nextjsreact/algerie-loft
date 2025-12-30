-- Setup RLS check function and audit_logs table for Supabase migration validation

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit_logs (service role can access all, authenticated users can only see their own)
CREATE POLICY "Service role can access all audit logs" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid()::text = user_id);

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RETURN COALESCE(rls_enabled, false);
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO anon;

-- Grant necessary permissions on audit_logs table
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Insert a test record to verify the table works
INSERT INTO public.audit_logs (table_name, operation, old_values, new_values, user_id)
VALUES ('test_setup', 'setup', '{}', '{"setup": true}', 'system')
ON CONFLICT DO NOTHING;