-- Create a view in the public schema that points to audit.audit_logs
-- This allows the Supabase REST API to access the audit logs

-- Drop the view if it exists
DROP VIEW IF EXISTS public.audit_logs_view CASCADE;

-- Create the view
CREATE VIEW public.audit_logs_view AS
SELECT 
  id,
  table_name,
  record_id,
  action,
  old_values,
  new_values,
  changed_fields,
  user_id,
  user_email,
  ip_address,
  user_agent,
  timestamp,
  created_at
FROM audit.audit_logs;

-- Grant permissions
GRANT SELECT ON public.audit_logs_view TO authenticated;
GRANT SELECT ON public.audit_logs_view TO anon;

-- Enable RLS on the view
ALTER VIEW public.audit_logs_view SET (security_invoker = true);

-- Create RLS policy for the view
-- Note: Views inherit RLS from the underlying table, but we can add extra policies
CREATE POLICY "Superusers can view audit logs via view"
  ON audit.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Audit logs view created successfully!';
  RAISE NOTICE 'Use public.audit_logs_view to access audit logs via REST API';
  RAISE NOTICE 'The view points to audit.audit_logs';
END $$;
