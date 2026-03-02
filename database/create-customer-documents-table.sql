-- =====================================================
-- Table: customer_documents
-- Description: Stocke les documents des clients (pièces d'identité, contrats, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'identity_card', 'passport', 'contract', 'other'
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
    file_size INTEGER, -- Taille en bytes
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON public.customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type ON public.customer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_customer_documents_uploaded_at ON public.customer_documents(uploaded_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent voir tous les documents
CREATE POLICY "Authenticated users can view customer documents"
    ON public.customer_documents
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Les utilisateurs authentifiés peuvent insérer des documents
CREATE POLICY "Authenticated users can insert customer documents"
    ON public.customer_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Les utilisateurs authentifiés peuvent mettre à jour des documents
CREATE POLICY "Authenticated users can update customer documents"
    ON public.customer_documents
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Les utilisateurs authentifiés peuvent supprimer des documents
CREATE POLICY "Authenticated users can delete customer documents"
    ON public.customer_documents
    FOR DELETE
    TO authenticated
    USING (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_customer_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_documents_updated_at
    BEFORE UPDATE ON public.customer_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_documents_updated_at();

-- =====================================================
-- Storage Bucket pour les documents clients
-- =====================================================

-- Créer le bucket s'il n'existe pas (à exécuter via Supabase Dashboard ou API)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('customer-documents', 'customer-documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Note: Pour créer le bucket, utilisez le Dashboard Supabase:
-- Storage > Create bucket > Name: "customer-documents" > Public: No

COMMENT ON TABLE public.customer_documents IS 'Stocke les documents des clients (pièces d''identité, contrats scannés, etc.)';
COMMENT ON COLUMN public.customer_documents.document_type IS 'Type de document: identity_card, passport, contract, other';
COMMENT ON COLUMN public.customer_documents.file_path IS 'Chemin du fichier dans Supabase Storage (bucket: customer-documents)';
