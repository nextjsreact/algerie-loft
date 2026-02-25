-- Create wrapper functions in public schema that call audit schema functions
-- This is needed because Supabase RPC only works with public schema

-- Wrapper for set_audit_user_context
CREATE OR REPLACE FUNCTION public.set_audit_user_context(
    p_user_id UUID,
    p_user_email VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    PERFORM audit.set_audit_user_context(p_user_id, p_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper for clear_audit_user_context
CREATE OR REPLACE FUNCTION public.clear_audit_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM audit.clear_audit_user_context();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_audit_user_context(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_audit_user_context() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.set_audit_user_context IS 'Wrapper function to set audit context - calls audit.set_audit_user_context';
COMMENT ON FUNCTION public.clear_audit_user_context IS 'Wrapper function to clear audit context - calls audit.clear_audit_user_context';
