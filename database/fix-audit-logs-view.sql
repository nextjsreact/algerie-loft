-- Drop the existing view
DROP VIEW IF EXISTS public.audit_logs_view;

-- Create a unified view that combines both audit systems
-- Maps audit.audit_logs to the format expected by the superuser audit page
CREATE OR REPLACE VIEW public.audit_logs_view AS
-- System audit logs from audit.audit_logs
SELECT 
    al.id,
    al.user_id as superuser_id,
    CASE 
        WHEN al.table_name = 'lofts' THEN 'MAINTENANCE'
        WHEN al.table_name = 'transactions' THEN 'USER_MANAGEMENT'
        WHEN al.table_name = 'tasks' THEN 'MAINTENANCE'
        WHEN al.table_name = 'owners' THEN 'USER_MANAGEMENT'
        WHEN al.table_name = 'reservations' THEN 'USER_MANAGEMENT'
        ELSE 'SYSTEM_CONFIG'
    END as action_type,
    'MEDIUM' as action_category,
    jsonb_build_object(
        'operation', al.action,
        'table', al.table_name,
        'record_id', al.record_id,
        'old_values', al.old_values,
        'new_values', al.new_values,
        'changed_fields', al.changed_fields,
        'user_email', al.user_email
    ) as action_details,
    NULL::uuid as target_user_id,
    al.table_name as target_table,
    al.record_id as target_record_id,
    al.table_name || ' - ' || al.action as target_resource,
    al.ip_address,
    al.user_agent,
    al.session_id,
    CASE 
        WHEN al.action = 'DELETE' THEN 'HIGH'
        WHEN al.action = 'UPDATE' THEN 'MEDIUM'
        ELSE 'LOW'
    END as severity,
    true as success,
    NULL::text as error_message,
    NULL::integer as execution_time_ms,
    al.timestamp,
    al.created_at,
    jsonb_build_object(
        'user_email', al.user_email,
        'changed_fields', al.changed_fields
    ) as metadata
FROM audit.audit_logs al

UNION ALL

-- Superuser audit logs from superuser_audit_logs
SELECT 
    sal.id,
    sal.superuser_id,
    sal.action_type,
    sal.action_category,
    sal.action_details,
    sal.target_user_id,
    sal.target_table,
    sal.target_record_id,
    COALESCE(sal.target_table, 'N/A') as target_resource,
    sal.ip_address,
    sal.user_agent,
    sal.session_id,
    sal.severity,
    sal.success,
    sal.error_message,
    sal.execution_time_ms,
    sal.timestamp,
    sal.created_at,
    '{}'::jsonb as metadata
FROM public.superuser_audit_logs sal;

-- Grant permissions
GRANT SELECT ON public.audit_logs_view TO authenticated;
GRANT SELECT ON public.audit_logs_view TO service_role;
