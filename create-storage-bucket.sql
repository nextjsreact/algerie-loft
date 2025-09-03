-- Create storage bucket for loft photos
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('loft-photos', 'loft-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create loft_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS loft_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loft_photos_loft_id ON loft_photos(loft_id);
CREATE INDEX IF NOT EXISTS idx_loft_photos_uploaded_by ON loft_photos(uploaded_by);

-- Enable RLS
ALTER TABLE loft_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loft_photos table
CREATE POLICY "Users can view all loft photos" ON loft_photos
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert loft photos" ON loft_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own loft photos" ON loft_photos
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own loft photos" ON loft_photos
    FOR DELETE USING (uploaded_by = auth.uid());

-- Storage policies
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