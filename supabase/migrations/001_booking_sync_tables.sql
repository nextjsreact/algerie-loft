-- =====================================================
-- Migration: Booking Sync System - Tables & Indexes
-- Description: Create all tables for Airbnb sync system
-- Date: 2026-05-14
-- =====================================================

-- =====================================================
-- 1. PROPERTY SYNC CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS property_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
  ical_url_airbnb TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loft_id)
);

COMMENT ON TABLE property_sync_config IS 'Configuration de synchronisation iCal pour chaque loft/propriété';
COMMENT ON COLUMN property_sync_config.loft_id IS 'Référence vers la table lofts';
COMMENT ON COLUMN property_sync_config.ical_url_airbnb IS 'URL du flux iCal Airbnb pour cette propriété';
COMMENT ON COLUMN property_sync_config.is_active IS 'Si FALSE, la propriété est ignorée lors de la synchronisation';
COMMENT ON COLUMN property_sync_config.last_sync_at IS 'Timestamp de la dernière synchronisation réussie';
COMMENT ON COLUMN property_sync_config.last_sync_status IS 'Statut de la dernière synchronisation: success, error, partial';

-- =====================================================
-- 2. AIRBNB BOOKINGS TABLE
-- =====================================================
-- Note: Renamed to "airbnb_bookings" to avoid conflict with existing "bookings" table
CREATE TABLE IF NOT EXISTS airbnb_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('airbnb_ical', 'airbnb_csv', 'manual')),
  external_id TEXT, -- UID iCal ou Confirmation Code CSV
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending', 'checked_in', 'checked_out')),
  
  -- Dates (toujours présentes)
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  
  -- Détails clients (nullable pour Partial_Reservation)
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Montant (nullable pour Partial_Reservation)
  amount DECIMAL(10,2),
  currency TEXT, -- ISO 4217 (EUR, USD, DZD, etc.)
  
  -- Métadonnées
  is_complete BOOLEAN DEFAULT FALSE, -- TRUE si enrichi par CSV
  csv_only_flag BOOLEAN DEFAULT FALSE, -- TRUE si créé par CSV sans match iCal
  raw_data JSONB, -- Données brutes iCal ou CSV pour debugging
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unicité: même propriété, mêmes dates = 1 seule réservation
  -- IMPORTANT: Pas de "source" dans la contrainte pour permettre le matching iCal ↔ CSV
  UNIQUE(loft_id, check_in_date, check_out_date),
  
  -- Contrainte: check-in < check-out
  CHECK (check_in_date < check_out_date),
  
  -- Contrainte: check-in pas plus de 30 jours dans le passé
  CHECK (check_in_date >= CURRENT_DATE - INTERVAL '30 days')
);

COMMENT ON TABLE airbnb_bookings IS 'Réservations Airbnb synchronisées (iCal + CSV) - Séparée de la table bookings existante';
COMMENT ON COLUMN airbnb_bookings.loft_id IS 'Référence vers la table lofts';
COMMENT ON COLUMN airbnb_bookings.source IS 'Source de la réservation: airbnb_ical (dates uniquement), airbnb_csv (détails complets), manual (import manuel)';
COMMENT ON COLUMN airbnb_bookings.external_id IS 'UID iCal ou Confirmation Code Airbnb';
COMMENT ON COLUMN airbnb_bookings.is_complete IS 'TRUE si la réservation a été enrichie avec les détails CSV';
COMMENT ON COLUMN airbnb_bookings.csv_only_flag IS 'TRUE si la réservation a été créée par CSV sans match iCal préalable';
COMMENT ON COLUMN airbnb_bookings.raw_data IS 'Données brutes JSON pour debugging et audit';

-- =====================================================
-- 3. CONFLICTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS airbnb_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
  booking_id_1 UUID NOT NULL REFERENCES airbnb_bookings(id) ON DELETE CASCADE,
  booking_id_2 UUID NOT NULL REFERENCES airbnb_bookings(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  overlap_start DATE NOT NULL,
  overlap_end DATE NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Contrainte: booking_id_1 != booking_id_2
  CHECK (booking_id_1 != booking_id_2)
);

COMMENT ON TABLE airbnb_conflicts IS 'Conflits de réservation Airbnb (chevauchements de dates)';
COMMENT ON COLUMN airbnb_conflicts.loft_id IS 'Référence vers la table lofts';
COMMENT ON COLUMN airbnb_conflicts.severity IS 'Sévérité du conflit: info (informatif), warning (attention), critical (double réservation)';
COMMENT ON COLUMN airbnb_conflicts.status IS 'Statut: active (non résolu), resolved (résolu), ignored (ignoré par admin)';
COMMENT ON COLUMN airbnb_conflicts.overlap_start IS 'Date de début du chevauchement';
COMMENT ON COLUMN airbnb_conflicts.overlap_end IS 'Date de fin du chevauchement';

-- =====================================================
-- 4. SYNC LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS airbnb_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('ical_auto', 'csv_auto', 'csv_manual', 'sync_now')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Métriques
  properties_synced INTEGER DEFAULT 0,
  bookings_created INTEGER DEFAULT 0,
  bookings_updated INTEGER DEFAULT 0,
  csv_matched INTEGER DEFAULT 0,
  csv_unmatched INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  duration_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE airbnb_sync_logs IS 'Historique de toutes les synchronisations Airbnb avec métriques';
COMMENT ON COLUMN airbnb_sync_logs.sync_type IS 'Type de sync: ical_auto (cron 30min), csv_auto (playwright 3h), csv_manual (admin upload), sync_now (bouton admin)';
COMMENT ON COLUMN airbnb_sync_logs.status IS 'Résultat global: success (tout OK), error (échec complet), partial (certaines propriétés ont échoué)';
COMMENT ON COLUMN airbnb_sync_logs.severity IS 'Niveau de gravité pour filtrage et alertes';
COMMENT ON COLUMN airbnb_sync_logs.error_details IS 'Détails des erreurs en JSON pour debugging';

-- =====================================================
-- 5. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID, -- user_id (nullable car peut être système)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Paramètres système configurables (toggles, flags, etc.)';
COMMENT ON COLUMN system_settings.key IS 'Clé unique du paramètre (ex: playwright_toggle)';
COMMENT ON COLUMN system_settings.value IS 'Valeur du paramètre (stockée en TEXT, à parser selon le type)';
COMMENT ON COLUMN system_settings.updated_by IS 'UUID de l''utilisateur qui a modifié le paramètre (NULL si système)';

-- Insérer le Playwright Toggle par défaut
INSERT INTO system_settings (key, value, description)
VALUES ('playwright_toggle', 'true', 'Active/désactive le Playwright CSV export automatique (GitHub Actions)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Airbnb bookings indexes
CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_loft_dates 
  ON airbnb_bookings(loft_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_source 
  ON airbnb_bookings(source);

CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_status 
  ON airbnb_bookings(status);

CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_dates 
  ON airbnb_bookings(check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_external_id 
  ON airbnb_bookings(external_id) WHERE external_id IS NOT NULL;

-- Conflicts indexes
CREATE INDEX IF NOT EXISTS idx_airbnb_conflicts_loft 
  ON airbnb_conflicts(loft_id);

CREATE INDEX IF NOT EXISTS idx_airbnb_conflicts_status 
  ON airbnb_conflicts(status);

CREATE INDEX IF NOT EXISTS idx_airbnb_conflicts_bookings 
  ON airbnb_conflicts(booking_id_1, booking_id_2);

-- Sync logs indexes
CREATE INDEX IF NOT EXISTS idx_airbnb_sync_logs_type_created 
  ON airbnb_sync_logs(sync_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_airbnb_sync_logs_status 
  ON airbnb_sync_logs(status);

-- Property sync config indexes
CREATE INDEX IF NOT EXISTS idx_property_sync_config_active 
  ON property_sync_config(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_sync_config
CREATE TRIGGER update_property_sync_config_updated_at
  BEFORE UPDATE ON property_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings
CREATE TRIGGER update_airbnb_bookings_updated_at
  BEFORE UPDATE ON airbnb_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VALIDATION
-- =====================================================

-- Verify all tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name IN ('property_sync_config', 'airbnb_bookings', 'airbnb_conflicts', 'airbnb_sync_logs', 'system_settings')) = 5,
         'Not all tables were created successfully';
  
  RAISE NOTICE 'Migration 001 completed successfully: All tables and indexes created';
END $$;
