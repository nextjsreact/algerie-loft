# 🔄 Refresh de la Base de Données de Développement

## Objectif
Synchroniser la structure de la base de développement avec celle de la production pour avoir les mêmes tables et colonnes.

---

## 📊 Environnements

### Production (Source)
- **URL:** `mhngbluefyucoesgcjoy.supabase.co`
- **Statut:** Structure à jour avec migrations 005-009
- **Tables Airbnb:** ✅ Créées et fonctionnelles

### Développement (Cible)
- **URL:** `wtcbyjdwjrrqyzpvjfze.supabase.co`
- **Statut:** Structure obsolète
- **Tables Airbnb:** ❌ À créer

---

## 🎯 Méthode Recommandée : Appliquer les Migrations SQL

### Option 1 : Copier les Migrations depuis la Production (RECOMMANDÉ)

#### Étape 1 : Exporter la Structure depuis Production

```sql
-- À exécuter dans Supabase PRODUCTION (mhngbluefyucoesgcjoy)
-- SQL Editor > New Query

-- 1. Exporter la structure de la table reservations
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || 
        data_type || 
        CASE WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns
WHERE table_name = 'reservations'
GROUP BY table_name;

-- 2. Exporter la structure des tables Airbnb
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN (
    'airbnb_reservations_staging',
    'airbnb_sync_logs',
    'airbnb_conflicts'
)
ORDER BY table_name, ordinal_position;
```

#### Étape 2 : Localiser les Migrations SQL

Les migrations SQL devraient être dans le dossier `supabase/migrations/` ou similaire. Cherchons-les :

```bash
# Dans PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft
dir /s /b *.sql
```

#### Étape 3 : Appliquer les Migrations en DEV

Une fois les fichiers de migration localisés, les appliquer dans l'ordre :
1. `005-add-airbnb-listing-id.sql`
2. `006-create-airbnb-staging.sql`
3. `007-create-airbnb-sync-logs.sql`
4. `008-create-airbnb-conflicts.sql`
5. `009-add-reservations-airbnb-fields.sql`

---

## 📝 Migrations SQL Complètes (À Appliquer en DEV)

### Migration 005 : Ajouter airbnb_listing_id aux lofts

```sql
-- =====================================================
-- Migration 005: Ajouter airbnb_listing_id aux lofts
-- =====================================================

-- Ajouter la colonne airbnb_listing_id
ALTER TABLE lofts 
ADD COLUMN IF NOT EXISTS airbnb_listing_id VARCHAR(50);

-- Créer un index unique pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id_unique 
ON lofts(airbnb_listing_id) 
WHERE airbnb_listing_id IS NOT NULL;

-- Créer un index pour les recherches
CREATE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id 
ON lofts(airbnb_listing_id);

-- Ajouter un commentaire
COMMENT ON COLUMN lofts.airbnb_listing_id IS 'ID numérique du listing Airbnb (ex: 12345678)';
```

### Migration 006 : Créer la table airbnb_reservations_staging

```sql
-- =====================================================
-- Migration 006: Table de staging pour les réservations Airbnb
-- =====================================================

CREATE TABLE IF NOT EXISTS airbnb_reservations_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Données Airbnb brutes
    airbnb_id VARCHAR(50) NOT NULL,
    listing_id VARCHAR(50) NOT NULL,
    raw_data JSONB NOT NULL,
    
    -- Données parsées
    guest_name VARCHAR(255) NOT NULL,
    guest_count INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cleaning_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'DZD',
    status VARCHAR(20) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    guest_nationality VARCHAR(2),
    special_requests TEXT,
    
    -- Mapping et réconciliation
    loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL,
    mapping_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    validation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    validation_errors JSONB,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reconciliation_action VARCHAR(20),
    reconciliation_error TEXT,
    
    -- Métadonnées de synchronisation
    sync_type VARCHAR(20) NOT NULL,
    sync_batch_id UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT chk_mapping_status CHECK (mapping_status IN ('pending', 'mapped', 'failed')),
    CONSTRAINT chk_validation_status CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    CONSTRAINT chk_reconciliation_status CHECK (reconciliation_status IN ('pending', 'created', 'updated', 'skipped', 'failed')),
    CONSTRAINT chk_reconciliation_action CHECK (reconciliation_action IN ('create', 'update', 'skip')),
    CONSTRAINT chk_sync_type CHECK (sync_type IN ('ical_watcher', 'targeted', 'full', 'manual'))
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_staging_airbnb_id ON airbnb_reservations_staging(airbnb_id);
CREATE INDEX IF NOT EXISTS idx_staging_listing_id ON airbnb_reservations_staging(listing_id);
CREATE INDEX IF NOT EXISTS idx_staging_sync_batch_id ON airbnb_reservations_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_loft_id ON airbnb_reservations_staging(loft_id);
CREATE INDEX IF NOT EXISTS idx_staging_reservation_id ON airbnb_reservations_staging(reservation_id);
CREATE INDEX IF NOT EXISTS idx_staging_mapping_status ON airbnb_reservations_staging(mapping_status);
CREATE INDEX IF NOT EXISTS idx_staging_reconciliation_status ON airbnb_reservations_staging(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_staging_created_at ON airbnb_reservations_staging(created_at DESC);

-- Commentaires
COMMENT ON TABLE airbnb_reservations_staging IS 'Table de staging pour les réservations Airbnb avant réconciliation';
COMMENT ON COLUMN airbnb_reservations_staging.airbnb_id IS 'Code de confirmation Airbnb (ex: HMABCD123)';
COMMENT ON COLUMN airbnb_reservations_staging.listing_id IS 'ID numérique du listing Airbnb';
COMMENT ON COLUMN airbnb_reservations_staging.raw_data IS 'Données JSON brutes reçues du script Python';
COMMENT ON COLUMN airbnb_reservations_staging.sync_batch_id IS 'UUID du batch de synchronisation';
```

### Migration 007 : Créer la table airbnb_sync_logs

```sql
-- =====================================================
-- Migration 007: Table des logs de synchronisation Airbnb
-- =====================================================

CREATE TABLE IF NOT EXISTS airbnb_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Métadonnées de synchronisation
    sync_type VARCHAR(20) NOT NULL,
    sync_batch_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    
    -- Métriques
    lofts_processed INTEGER NOT NULL DEFAULT 0,
    reservations_received INTEGER NOT NULL DEFAULT 0,
    reservations_created INTEGER NOT NULL DEFAULT 0,
    reservations_updated INTEGER NOT NULL DEFAULT 0,
    reservations_skipped INTEGER NOT NULL DEFAULT 0,
    reservations_failed INTEGER NOT NULL DEFAULT 0,
    conflicts_detected INTEGER NOT NULL DEFAULT 0,
    
    -- Détails
    errors JSONB,
    warnings JSONB,
    duration_ms INTEGER,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Métadonnées supplémentaires
    script_version VARCHAR(20),
    triggered_by VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_sync_type CHECK (sync_type IN ('ical_watcher', 'targeted', 'full', 'manual')),
    CONSTRAINT chk_status CHECK (status IN ('started', 'success', 'partial', 'failed')),
    CONSTRAINT chk_triggered_by CHECK (triggered_by IN ('cron', 'manual', 'api'))
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_batch_id ON airbnb_sync_logs(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON airbnb_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON airbnb_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON airbnb_sync_logs(sync_type);

-- Commentaires
COMMENT ON TABLE airbnb_sync_logs IS 'Logs de synchronisation Airbnb pour monitoring et debugging';
COMMENT ON COLUMN airbnb_sync_logs.sync_batch_id IS 'UUID unique pour chaque batch de synchronisation';
COMMENT ON COLUMN airbnb_sync_logs.duration_ms IS 'Durée de la synchronisation en millisecondes';
```

### Migration 008 : Créer la table airbnb_conflicts

```sql
-- =====================================================
-- Migration 008: Table des conflits de réservation Airbnb
-- =====================================================

CREATE TABLE IF NOT EXISTS airbnb_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    reservation_1_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    reservation_2_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Détails du conflit
    overlap_start DATE NOT NULL,
    overlap_end DATE NOT NULL,
    overlap_nights INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    
    -- Gestion du conflit
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    -- Notifications
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_severity CHECK (severity IN ('critical', 'warning', 'info')),
    CONSTRAINT chk_status CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
    CONSTRAINT chk_different_reservations CHECK (reservation_1_id != reservation_2_id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_conflicts_loft_id ON airbnb_conflicts(loft_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_reservation_1_id ON airbnb_conflicts(reservation_1_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_reservation_2_id ON airbnb_conflicts(reservation_2_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON airbnb_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON airbnb_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_created_at ON airbnb_conflicts(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_airbnb_conflicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_airbnb_conflicts_updated_at
    BEFORE UPDATE ON airbnb_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_airbnb_conflicts_updated_at();

-- Commentaires
COMMENT ON TABLE airbnb_conflicts IS 'Conflits de réservation détectés (chevauchements de dates)';
COMMENT ON COLUMN airbnb_conflicts.overlap_nights IS 'Nombre de nuits en conflit';
COMMENT ON COLUMN airbnb_conflicts.severity IS 'Sévérité du conflit (critical, warning, info)';
```

### Migration 009 : Ajouter les champs Airbnb à reservations

```sql
-- =====================================================
-- Migration 009: Ajouter les champs Airbnb à reservations
-- =====================================================

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS airbnb_confirmation_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'DZD',
ADD COLUMN IF NOT EXISTS guest_nationality VARCHAR(2),
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Créer un index unique pour airbnb_confirmation_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_airbnb_confirmation_code_unique 
ON reservations(airbnb_confirmation_code) 
WHERE airbnb_confirmation_code IS NOT NULL;

-- Créer des index pour les recherches
CREATE INDEX IF NOT EXISTS idx_reservations_source ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_reservations_synced_at ON reservations(synced_at);

-- Vérifier si la colonne nights existe et si elle est GENERATED
DO $$
BEGIN
    -- Si nights n'est pas GENERATED, la convertir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'nights'
        AND is_generated = 'NEVER'
    ) THEN
        -- Supprimer la colonne existante
        ALTER TABLE reservations DROP COLUMN IF EXISTS nights;
        
        -- Recréer comme colonne GENERATED
        ALTER TABLE reservations 
        ADD COLUMN nights INTEGER GENERATED ALWAYS AS (
            EXTRACT(DAY FROM (check_out_date - check_in_date))::INTEGER
        ) STORED;
    END IF;
END $$;

-- Commentaires
COMMENT ON COLUMN reservations.airbnb_confirmation_code IS 'Code de confirmation Airbnb (ex: HMABCD123)';
COMMENT ON COLUMN reservations.source IS 'Source de la réservation (manual, airbnb_scraper, beds24, etc.)';
COMMENT ON COLUMN reservations.synced_at IS 'Date de dernière synchronisation avec Airbnb';
COMMENT ON COLUMN reservations.base_price IS 'Prix de base de la réservation';
COMMENT ON COLUMN reservations.cleaning_fee IS 'Frais de ménage';
COMMENT ON COLUMN reservations.service_fee IS 'Frais de service';
COMMENT ON COLUMN reservations.taxes IS 'Taxes';
COMMENT ON COLUMN reservations.currency_code IS 'Code devise (DZD, EUR, USD, etc.)';
COMMENT ON COLUMN reservations.guest_nationality IS 'Code pays de nationalité du voyageur (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN reservations.special_requests IS 'Demandes spéciales du voyageur';
```

---

## 🚀 Procédure d'Application

### Étape 1 : Se Connecter à Supabase DEV

1. Ouvrir https://supabase.com/dashboard
2. Sélectionner le projet **DEV** : `wtcbyjdwjrrqyzpvjfze`
3. Aller dans **SQL Editor**

### Étape 2 : Appliquer les Migrations dans l'Ordre

1. Copier le contenu de **Migration 005**
2. Coller dans SQL Editor
3. Cliquer sur **Run**
4. Répéter pour les migrations 006, 007, 008, 009

### Étape 3 : Vérifier l'Application

```sql
-- Vérifier que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'lofts',
    'reservations',
    'airbnb_reservations_staging',
    'airbnb_sync_logs',
    'airbnb_conflicts'
)
ORDER BY table_name;

-- Vérifier les colonnes de lofts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts'
AND column_name = 'airbnb_listing_id';

-- Vérifier les colonnes de reservations
SELECT column_name, data_type, is_nullable, is_generated
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name IN ('airbnb_confirmation_code', 'source', 'nights', 'base_price');
```

### Étape 4 : Créer des Données de Test en DEV

```sql
-- Créer un loft de test
INSERT INTO lofts (name, address, airbnb_listing_id, status)
VALUES (
    'TEST - Star Loft',
    '27 Rue Mohamed BENLAREDJ 1er étage, appartement N°5 El Madania',
    '12345678',
    'active'
)
ON CONFLICT (airbnb_listing_id) DO NOTHING;

-- Vérifier le loft créé
SELECT id, name, address, airbnb_listing_id
FROM lofts
WHERE airbnb_listing_id = '12345678';
```

---

## ✅ Checklist de Vérification

- [ ] Migration 005 appliquée (airbnb_listing_id dans lofts)
- [ ] Migration 006 appliquée (table airbnb_reservations_staging)
- [ ] Migration 007 appliquée (table airbnb_sync_logs)
- [ ] Migration 008 appliquée (table airbnb_conflicts)
- [ ] Migration 009 appliquée (champs Airbnb dans reservations)
- [ ] Toutes les tables existent
- [ ] Tous les index sont créés
- [ ] La colonne `nights` est GENERATED
- [ ] Loft de test créé en DEV
- [ ] Environnement DEV prêt pour les tests

---

## 🔄 Après le Refresh

### Basculer vers l'Environnement DEV

```bash
# Dans PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft

# Sauvegarder la config production
copy .env.local .env.production.backup

# Activer l'environnement de développement
copy .env.development .env.local

# Redémarrer le serveur
# Arrêter le serveur actuel (Ctrl+C)
npm run dev
```

### Tester l'Import en DEV

1. Ouvrir http://localhost:3000/fr/admin/airbnb/import
2. Importer `test-data/reservations_test.json`
3. Vérifier que tout fonctionne correctement
4. Tester les différents scénarios

---

**Auteur :** Kiro AI Assistant  
**Date :** 2026-05-18  
**Version :** 1.0.0
