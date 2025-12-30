# Supabase Setup Guide for Next.js 16 Migration

## Overview

This guide helps you complete the Supabase setup required for the Next.js 16 migration validation.

## Current Status

✅ **Database Connections**: Working  
✅ **Storage Buckets**: Created and functional  
✅ **File Uploads**: Working  
⚠️ **Missing Components**: audit_logs table and RLS functions  

## Required Manual Setup

### 1. Create audit_logs Table and RLS Function

Go to your Supabase Dashboard > SQL Editor and execute the following SQL:

```sql
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

-- Create RLS policy for audit_logs
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO anon;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
```

### 2. Upload Test Images (Optional)

To test image optimization, upload a few test images to the `loft-images` bucket:

1. Go to Supabase Dashboard > Storage > loft-images
2. Upload 2-3 sample images (JPEG/PNG format)
3. This will enable the image optimization tests

## Validation Commands

After completing the manual setup, run these commands to validate:

```bash
# Test basic connection
npx tsx scripts/test-supabase-connection-simple.ts

# Full validation suite
npx tsx scripts/validate-supabase-integrations.ts
```

## Expected Results

After setup, you should see:

- ✅ All database connections working
- ✅ All CRUD operations working (including audit_logs)
- ✅ All RLS policies validated
- ✅ All storage buckets functional
- ✅ File uploads working
- ✅ Image optimization tests (if test images uploaded)

## Storage Buckets Created

The following buckets have been automatically created:

| Bucket Name | Visibility | Purpose | File Size Limit |
|-------------|------------|---------|-----------------|
| `loft-images` | Public | Loft property images | 10MB |
| `user-avatars` | Public | User profile pictures | 2MB |
| `documents` | Private | User documents | 50MB |
| `reports` | Private | Generated reports | 20MB |

## Troubleshooting

### Connection Issues
- Verify environment variables in `.env` file
- Check Supabase project status in dashboard
- Ensure service role key has correct permissions

### Storage Issues
- Verify bucket policies in Supabase Dashboard > Storage
- Check file upload permissions
- Ensure CORS is configured for your domain

### RLS Issues
- Verify RLS is enabled on tables that need it
- Check policy definitions in Supabase Dashboard > Authentication > Policies
- Test with different user roles

## Next Steps

Once validation passes:

1. ✅ Database connections validated
2. ✅ Storage system validated  
3. ✅ File upload functionality confirmed
4. ✅ Image URL generation working
5. ✅ Ready for Next.js 16 migration

The Supabase integration is ready for the migration process!