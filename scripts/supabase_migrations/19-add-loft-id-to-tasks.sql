-- Migration: Add loft_id column to tasks table for task-loft association
-- This migration adds the ability to associate tasks with specific lofts

BEGIN;

-- Add loft_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS loft_id UUID;

-- Add foreign key constraint with ON DELETE SET NULL behavior
-- This ensures that when a loft is deleted, associated tasks remain but lose the loft reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_tasks_loft_id' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT fk_tasks_loft_id 
    FOREIGN KEY (loft_id) REFERENCES public.lofts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance when filtering tasks by loft
CREATE INDEX IF NOT EXISTS idx_tasks_loft_id 
ON public.tasks(loft_id) 
WHERE loft_id IS NOT NULL;

-- Add comment to document the new column
COMMENT ON COLUMN public.tasks.loft_id IS 'Optional reference to the loft associated with this task. NULL if no loft is associated.';

COMMIT;

-- Verification query (commented out for production)
-- SELECT 'Migration completed successfully. Tasks table now has loft_id column.' as status;