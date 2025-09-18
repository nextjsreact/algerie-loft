-- Performance optimization for Task-Loft Association
-- This migration adds indexes and optimizations for better query performance

BEGIN;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_loft_status 
ON public.tasks(loft_id, status) 
WHERE loft_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_status_created_at 
ON public.tasks(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_loft 
ON public.tasks(assigned_to, loft_id) 
WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status 
ON public.tasks(due_date, status) 
WHERE due_date IS NOT NULL;

-- Partial index for active tasks with lofts
CREATE INDEX IF NOT EXISTS idx_tasks_active_with_loft 
ON public.tasks(loft_id, updated_at DESC) 
WHERE status IN ('todo', 'in_progress') AND loft_id IS NOT NULL;

-- Index for orphaned task detection
CREATE INDEX IF NOT EXISTS idx_tasks_loft_id_not_null 
ON public.tasks(loft_id) 
WHERE loft_id IS NOT NULL;

-- Optimize lofts table for task associations
CREATE INDEX IF NOT EXISTS idx_lofts_name_status 
ON public.lofts(name, status);

-- Create materialized view for task-loft statistics (optional, for heavy analytics)
CREATE MATERIALIZED VIEW IF NOT EXISTS task_loft_stats_mv AS
SELECT 
  l.id as loft_id,
  l.name as loft_name,
  l.address as loft_address,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) as overdue_tasks,
  CASE 
    WHEN COUNT(t.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / COUNT(t.id)) * 100, 2)
    ELSE 0 
  END as completion_rate,
  MAX(t.updated_at) as last_task_update
FROM public.lofts l
LEFT JOIN public.tasks t ON l.id = t.loft_id
GROUP BY l.id, l.name, l.address;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_loft_stats_mv_loft_id 
ON task_loft_stats_mv(loft_id);

CREATE INDEX IF NOT EXISTS idx_task_loft_stats_mv_completion_rate 
ON task_loft_stats_mv(completion_rate DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_task_loft_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY task_loft_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- Create optimized function for getting tasks with loft info
CREATE OR REPLACE FUNCTION get_tasks_with_loft_optimized(
  user_role TEXT DEFAULT 'admin',
  user_id_param UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(20),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  assigned_to UUID,
  loft_id UUID,
  loft_name VARCHAR(255),
  loft_address TEXT,
  is_orphaned BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.user_id,
    t.created_at,
    t.updated_at,
    t.due_date,
    t.assigned_to,
    t.loft_id,
    l.name as loft_name,
    l.address as loft_address,
    CASE 
      WHEN t.loft_id IS NOT NULL AND l.id IS NULL THEN true 
      ELSE false 
    END as is_orphaned
  FROM public.tasks t
  LEFT JOIN public.lofts l ON t.loft_id = l.id
  WHERE 
    CASE 
      WHEN user_role IN ('admin', 'manager') THEN TRUE
      WHEN user_role = 'member' THEN t.assigned_to = user_id_param
      ELSE t.user_id = user_id_param
    END
  ORDER BY t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tasks_with_loft_optimized(TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_task_loft_stats() TO authenticated;

-- Create function for fast loft statistics
CREATE OR REPLACE FUNCTION get_loft_task_summary()
RETURNS TABLE (
  total_lofts BIGINT,
  lofts_with_tasks BIGINT,
  lofts_without_tasks BIGINT,
  total_tasks BIGINT,
  tasks_with_loft BIGINT,
  tasks_without_loft BIGINT,
  orphaned_tasks BIGINT,
  avg_tasks_per_loft NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH loft_counts AS (
    SELECT 
      COUNT(*) as total_lofts,
      COUNT(CASE WHEN task_count > 0 THEN 1 END) as lofts_with_tasks
    FROM (
      SELECT l.id, COUNT(t.id) as task_count
      FROM public.lofts l
      LEFT JOIN public.tasks t ON l.id = t.loft_id
      GROUP BY l.id
    ) loft_task_counts
  ),
  task_counts AS (
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN loft_id IS NOT NULL THEN 1 END) as tasks_with_loft_raw,
      COUNT(CASE WHEN loft_id IS NULL THEN 1 END) as tasks_without_loft,
      COUNT(CASE WHEN loft_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.lofts WHERE id = tasks.loft_id
      ) THEN 1 END) as orphaned_tasks
    FROM public.tasks
  )
  SELECT 
    lc.total_lofts,
    lc.lofts_with_tasks,
    lc.total_lofts - lc.lofts_with_tasks as lofts_without_tasks,
    tc.total_tasks,
    tc.tasks_with_loft_raw - tc.orphaned_tasks as tasks_with_loft,
    tc.tasks_without_loft,
    tc.orphaned_tasks,
    CASE 
      WHEN lc.lofts_with_tasks > 0 THEN 
        ROUND((tc.tasks_with_loft_raw - tc.orphaned_tasks)::numeric / lc.lofts_with_tasks, 2)
      ELSE 0 
    END as avg_tasks_per_loft
  FROM loft_counts lc, task_counts tc;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_loft_task_summary() TO authenticated;

-- Add table statistics update
ANALYZE public.tasks;
ANALYZE public.lofts;

-- Create trigger to auto-refresh materialized view on task changes
CREATE OR REPLACE FUNCTION trigger_refresh_task_loft_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh materialized view asynchronously (in production, consider using a job queue)
  PERFORM refresh_task_loft_stats();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers (be careful with these in high-traffic environments)
DROP TRIGGER IF EXISTS trigger_task_loft_stats_refresh ON public.tasks;
CREATE TRIGGER trigger_task_loft_stats_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_task_loft_stats();

COMMIT;

-- Initial refresh of materialized view
SELECT refresh_task_loft_stats();

-- Performance analysis query (for monitoring)
-- SELECT 'Performance optimization completed. Indexes and functions created.' as status;