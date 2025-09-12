-- Création de la table customers pour la version Basic
-- Cette table est conçue pour être compatible avec la future table tenants de Premium

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations personnelles de base
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Statut simple pour Basic (extensible pour Premium)
  status VARCHAR(20) DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'former')),
  
  -- Notes libres
  notes TEXT,
  
  -- Relation avec les lofts (pour Basic)
  current_loft_id UUID REFERENCES lofts(id),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_loft ON customers(current_loft_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);

-- RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés
CREATE POLICY "Users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete customers" ON customers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();