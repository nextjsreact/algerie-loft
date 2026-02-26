-- =====================================================
-- CREATE BACKUPS STORAGE BUCKET
-- =====================================================
-- Run this script in Supabase SQL Editor to create the storage bucket for backups

-- Create the backups bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  false, -- Private bucket, only accessible by authenticated superusers
  524288000, -- 500 MB max file size
  ARRAY['application/sql', 'text/plain', 'application/x-sql']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the backups bucket
-- Only superusers can access backup files
CREATE POLICY "Superusers can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'superuser'
  )
);

CREATE POLICY "Superusers can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'superuser'
  )
);

CREATE POLICY "Superusers can update backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'superuser'
  )
);

CREATE POLICY "Superusers can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'superuser'
  )
);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKUPS STORAGE BUCKET CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket: backups (private)';
    RAISE NOTICE 'Max file size: 500 MB';
    RAISE NOTICE 'Allowed types: SQL files';
    RAISE NOTICE 'Access: Superusers only';
    RAISE NOTICE '';
    RAISE NOTICE 'The backup system will now store backups in Supabase Storage';
    RAISE NOTICE '========================================';
END $$;
