-- Extension du système de rôles pour inclure le niveau exécutif
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter le rôle 'executive' au type user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive';

-- 2. Créer une table pour les permissions spéciales
CREATE TABLE IF NOT EXISTS executive_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_type VARCHAR(50) NOT NULL, -- 'financial_overview', 'strategic_analytics', 'sensitive_data'
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  UNIQUE(user_id, permission_type)
);

-- 3. Créer une table pour les métriques sensibles
CREATE TABLE IF NOT EXISTS executive_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value JSONB NOT NULL,
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visibility_level VARCHAR(20) DEFAULT 'executive' -- 'executive', 'admin', 'manager'
);

-- 4. Table pour les alertes critiques
CREATE TABLE IF NOT EXISTS critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL, -- 'revenue_drop', 'occupancy_critical', 'cash_flow'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id)
);

-- 5. RLS Policies pour les données sensibles
ALTER TABLE executive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_permissions ENABLE ROW LEVEL SECURITY;

-- Seuls les executives peuvent voir les métriques executives
CREATE POLICY "Executive metrics access" ON executive_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'executive'
    )
  );

-- Seuls les executives et admins peuvent voir les alertes critiques
CREATE POLICY "Critical alerts access" ON critical_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('executive', 'admin')
    )
  );

-- Permissions spéciales visibles par executives et admins
CREATE POLICY "Executive permissions access" ON executive_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('executive', 'admin')
    )
  );

-- 6. Créer un utilisateur executive de démonstration
INSERT INTO auth.users (id, email, encrypted_password, role, raw_user_meta_data)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'executive@loftmanager.com', 
  crypt('executive123', gen_salt('bf')), 
  'authenticated', 
  jsonb_build_object('full_name', 'Executive Director', 'role', 'executive')
)
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'executive@loftmanager.com',
  'Executive Director',
  'executive'
)
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 7. Accorder toutes les permissions à l'executive
INSERT INTO executive_permissions (user_id, permission_type, granted_by)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  unnest(ARRAY['financial_overview', 'strategic_analytics', 'sensitive_data', 'critical_alerts']),
  '550e8400-e29b-41d4-a716-446655440001' -- Admin qui accorde les permissions
ON CONFLICT (user_id, permission_type) DO NOTHING;