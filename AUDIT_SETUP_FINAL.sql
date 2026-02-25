-- ============================================
-- SCRIPT SQL COMPLET POUR ACTIVER L'AUDIT
-- ============================================
-- Exécute ce script dans Supabase SQL Editor
-- ============================================

-- 1. Créer les fonctions wrapper dans le schéma public
CREATE OR REPLACE FUNCTION public.set_audit_user_context(
    p_user_id UUID,
    p_user_email VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    PERFORM audit.set_audit_user_context(p_user_id, p_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_audit_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM audit.clear_audit_user_context();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer une vue dans le schéma public pour audit_logs
CREATE OR REPLACE VIEW public.audit_logs AS
SELECT * FROM audit.audit_logs;

-- 3. Donner les permissions
GRANT EXECUTE ON FUNCTION public.set_audit_user_context(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_audit_user_context() TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- 4. Ajouter des commentaires
COMMENT ON FUNCTION public.set_audit_user_context IS 'Wrapper function to set audit context - calls audit.set_audit_user_context';
COMMENT ON FUNCTION public.clear_audit_user_context IS 'Wrapper function to clear audit context - calls audit.clear_audit_user_context';
COMMENT ON VIEW public.audit_logs IS 'View of audit.audit_logs table for Supabase client access';

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après avoir exécuté ce script, teste:
-- https://www.loftalgerie.com/api/test-audit
-- ============================================
