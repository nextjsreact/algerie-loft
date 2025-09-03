-- Migration: Créer la table loft_photos pour gérer les photos des lofts
-- Date: 2025-01-27

-- Créer la table loft_photos
CREATE TABLE IF NOT EXISTS public.loft_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur loft_id pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_loft_photos_loft_id ON public.loft_photos(loft_id);

-- Créer un index sur uploaded_by
CREATE INDEX IF NOT EXISTS idx_loft_photos_uploaded_by ON public.loft_photos(uploaded_by);

-- Ajouter le trigger pour updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.loft_photos
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Configurer RLS (Row Level Security)
ALTER TABLE public.loft_photos ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des photos aux utilisateurs authentifiés
CREATE POLICY "Users can view loft photos" ON public.loft_photos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Users can upload loft photos" ON public.loft_photos
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Politique pour permettre la suppression aux propriétaires et admins
CREATE POLICY "Users can delete their own loft photos" ON public.loft_photos
    FOR DELETE USING (
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Politique pour permettre la mise à jour aux propriétaires et admins
CREATE POLICY "Users can update their own loft photos" ON public.loft_photos
    FOR UPDATE USING (
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Créer le bucket de stockage pour les photos (si pas déjà créé)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loft-photos', 'loft-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de stockage pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload loft photos to storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'loft-photos' AND 
        auth.role() = 'authenticated'
    );

-- Politique de stockage pour permettre la lecture publique
CREATE POLICY "Public can view loft photos in storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'loft-photos');

-- Politique de stockage pour permettre la suppression aux propriétaires
CREATE POLICY "Users can delete their own loft photos from storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'loft-photos' AND 
        auth.role() = 'authenticated'
    );

-- Commentaires pour la documentation
COMMENT ON TABLE public.loft_photos IS 'Table pour stocker les métadonnées des photos des lofts';
COMMENT ON COLUMN public.loft_photos.loft_id IS 'Référence vers le loft auquel appartient la photo';
COMMENT ON COLUMN public.loft_photos.file_name IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN public.loft_photos.file_path IS 'Chemin du fichier dans le storage Supabase';
COMMENT ON COLUMN public.loft_photos.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN public.loft_photos.mime_type IS 'Type MIME du fichier (ex: image/jpeg)';
COMMENT ON COLUMN public.loft_photos.url IS 'URL publique pour accéder à la photo';
COMMENT ON COLUMN public.loft_photos.uploaded_by IS 'Utilisateur qui a uploadé la photo';