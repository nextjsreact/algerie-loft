-- Quick setup for loft-photos storage bucket
-- Run this in Supabase SQL Editor if you created the bucket manually

-- Create the bucket (if not already created via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loft-photos', 'loft-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload loft photos to storage" ON storage.objects;
DROP POLICY IF EXISTS "Public can view loft photos in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own loft photos from storage" ON storage.objects;

CREATE POLICY "Users can upload loft photos to storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'loft-photos' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Public can view loft photos in storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'loft-photos');

CREATE POLICY "Users can delete their own loft photos from storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'loft-photos' AND 
        auth.role() = 'authenticated'
    );