# Design: Intégration du Système de Scraping Airbnb Python v2.0.0

**Date:** 2026-05-17  
**Status:** Final  
**Version:** 1.0.0

---

## 🎯 Vue d'Ensemble

Ce document décrit l'architecture technique complète pour l'intégration du système de scraping Airbnb Python v2.0.0 avec l'application Next.js existante.

### Décisions Prises

| Décision | Choix Final |
|----------|-------------|
| **Priorité** | Commencer immédiatement |
| **Hébergement** | Local (dev) → Oracle Cloud Free Tier (prod) |
| **Schéma DB** | Architecture Hybride (reservations + staging) |
| **Mapping** | Colonne simple (MVP) → Table si besoin |
| **Historique** | Importer 1 an de réservations |
| **Full Scraper** | 4h du matin GMT+1 |
| **Alertes** | Notifications in-app + emails paramétrables |

---

## 🏗️ Architecture Globale

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    Environnement Local (Dev)                    │
│                  Oracle Cloud Free Tier (Prod)                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Docker Compose                                            │ │
│  │                                                           │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │ iCal Watcher     │  │ Targeted Scraper │             │ │
│  │  │ (toutes les 5min)│  │ (on-demand)      │             │ │
│  │  │ Python 3.11      │  │ Python 3.11      │             │ │
│  │  │ + CloakBrowser   │  │ + CloakBrowser   │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  │                                                           │ │
│  │  ┌──────────────────┐                                    │ │
│  │  │ Full Scraper     │                                    │ │
│  │  │ (4h GMT+1)       │                                    │ │
│  │  │ Python 3.11      │                                    │ │
│  │  │ + CloakBrowser   │                                    │ │
│  │  └──────────────────┘                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          ↓ HTTPS POST                          │
│                   POST /api/airbnb/sync                        │
│                   (API Key authentication)                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API (Vercel)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ POST /api/airbnb/sync                                     │ │
│  │ ├─ Authentification (API Key)                            │ │
│  │ ├─ Validation (Zod schema)                               │ │
│  │ ├─ Insert staging                                        │ │
│  │ ├─ Validation + Mapping                                  │ │
│  │ ├─ Upsert reservations                                   │ │
│  │ ├─ Détection conflits                                    │ │
│  │ └─ Notifications + Logs                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ lofts            │  │ reservations     │                   │
│  │ + listing_id     │  │ (étendue)        │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ staging          │  │ sync_logs        │                   │
│  │ (contrôle)       │  │ (monitoring)     │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Schéma de Base de Données

### Architecture Hybride

**Principe:** 2 tables complémentaires

1. **`reservations`** (table principale) - Source de vérité
2. **`airbnb_reservations_staging`** (table de contrôle) - Validation et réconciliation

### Migration 1: Étendre la Table `reservations`

```sql
-- Migration: 005_extend_reservations_for_airbnb.sql

-- Ajouter les colonnes Airbnb
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS airbnb_confirmation_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS taxes DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_nationality VARCHAR(10),
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;

-- Ajouter les indexes
CREATE INDEX IF NOT EXISTS idx_reservations_source 
  ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_reservations_airbnb_code 
  ON reservations(airbnb_confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_synced_at 
  ON reservations(synced_at);

-- Ajouter une contrainte pour vérifier la cohérence des montants
ALTER TABLE reservations 
  ADD CONSTRAINT check_total_amount_consistency 
  CHECK (
    total_amount IS NULL OR 
    total_amount >= 0
  );

-- Commentaires
COMMENT ON COLUMN reservations.source IS 'Source de la réservation: manual, airbnb_scraper, booking_com, etc.';
COMMENT ON COLUMN reservations.airbnb_confirmation_code IS 'Code de confirmation Airbnb (ex: HMABCD123)';
COMMENT ON COLUMN reservations.base_price IS 'Prix de base sans frais';
COMMENT ON COLUMN reservations.cleaning_fee IS 'Frais de ménage';
COMMENT ON COLUMN reservations.service_fee IS 'Frais de service Airbnb';
COMMENT ON COLUMN reservations.taxes IS 'Taxes';
COMMENT ON COLUMN reservations.synced_at IS 'Date de dernière synchronisation avec Airbnb';
```

### Migration 2: Créer la Table de Staging

```sql
-- Migration: 006_create_airbnb_staging.sql

CREATE TABLE airbnb_reservations_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiants Airbnb
  airbnb_id VARCHAR(50) NOT NULL,
  listing_id VARCHAR(50) NOT NULL,
  
  -- Données brutes (pour debugging et replay)
  raw_data JSONB NOT NULL,
  
  -- Données parsées
  guest_name VARCHAR(255),
  guest_count INTEGER,
  check_in_date DATE,
  check_out_date DATE,
  nights INTEGER,
  base_price DECIMAL(10,2),
  cleaning_fee DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  taxes DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency_code VARCHAR(10),
  status VARCHAR(50),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  guest_nationality VARCHAR(10),
  special_requests TEXT,
  
  -- Mapping et validation
  loft_id UUID REFERENCES lofts(id),
  mapping_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'mapped', 'failed'
  validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'valid', 'invalid'
  validation_errors JSONB,
  
  -- Réconciliation avec reservations
  reservation_id UUID REFERENCES reservations(id),
  reconciliation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'created', 'updated', 'skipped', 'failed'
  reconciliation_action VARCHAR(50), -- 'create', 'update', 'skip'
  reconciliation_error TEXT,
  
  -- Métadonnées de synchronisation
  sync_type VARCHAR(50), -- 'ical_watcher', 'targeted', 'full', 'manual'
  sync_batch_id UUID, -- Pour grouper les syncs
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Contrainte d'unicité (même réservation peut être reçue plusieurs fois)
  UNIQUE(airbnb_id, created_at)
);

-- Indexes pour performance
CREATE INDEX idx_staging_airbnb_id ON airbnb_reservations_staging(airbnb_id);
CREATE INDEX idx_staging_listing_id ON airbnb_reservations_staging(listing_id);
CREATE INDEX idx_staging_loft_id ON airbnb_reservations_staging(loft_id);
CREATE INDEX idx_staging_reconciliation_status ON airbnb_reservations_staging(reconciliation_status);
CREATE INDEX idx_staging_created_at ON airbnb_reservations_staging(created_at);
CREATE INDEX idx_staging_sync_batch ON airbnb_reservations_staging(sync_batch_id);

-- Commentaires
COMMENT ON TABLE airbnb_reservations_staging IS 'Table de staging pour validation et réconciliation des réservations Airbnb';
COMMENT ON COLUMN airbnb_reservations_staging.raw_data IS 'Données JSON brutes du scraper (pour debugging)';
COMMENT ON COLUMN airbnb_reservations_staging.mapping_status IS 'Statut du mapping listing_id → loft_id';
COMMENT ON COLUMN airbnb_reservations_staging.validation_status IS 'Statut de la validation des données';
COMMENT ON COLUMN airbnb_reservations_staging.reconciliation_status IS 'Statut de la réconciliation avec la table reservations';
```

### Migration 3: Ajouter le Mapping dans `lofts`

```sql
-- Migration: 007_add_airbnb_listing_id_to_lofts.sql

ALTER TABLE lofts 
  ADD COLUMN IF NOT EXISTS airbnb_listing_id VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id 
  ON lofts(airbnb_listing_id);

COMMENT ON COLUMN lofts.airbnb_listing_id IS 'ID de l''annonce Airbnb (numérique)';
```

### Migration 4: Créer la Table de Logs

```sql
-- Migration: 008_create_airbnb_sync_logs.sql

CREATE TABLE airbnb_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de synchronisation
  sync_type VARCHAR(50) NOT NULL, -- 'ical_watcher', 'targeted', 'full', 'manual'
  sync_batch_id UUID NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'started', 'success', 'partial', 'failed'
  
  -- Métriques
  lofts_processed INTEGER DEFAULT 0,
  reservations_received INTEGER DEFAULT 0,
  reservations_created INTEGER DEFAULT 0,
  reservations_updated INTEGER DEFAULT 0,
  reservations_skipped INTEGER DEFAULT 0,
  reservations_failed INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  
  -- Erreurs
  errors JSONB,
  warnings JSONB,
  
  -- Performance
  duration_ms INTEGER,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  
  -- Métadonnées
  script_version VARCHAR(50),
  triggered_by VARCHAR(50), -- 'cron', 'manual', 'api'
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_sync_type ON airbnb_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON airbnb_sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON airbnb_sync_logs(started_at);
CREATE INDEX idx_sync_logs_batch_id ON airbnb_sync_logs(sync_batch_id);

COMMENT ON TABLE airbnb_sync_logs IS 'Logs de synchronisation Airbnb pour monitoring';
```

### Migration 5: Créer la Table de Conflits

```sql
-- Migration: 009_create_airbnb_conflicts.sql

CREATE TABLE airbnb_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Loft concerné
  loft_id UUID REFERENCES lofts(id) NOT NULL,
  
  -- Réservations en conflit
  reservation_1_id UUID REFERENCES reservations(id) NOT NULL,
  reservation_2_id UUID REFERENCES reservations(id) NOT NULL,
  
  -- Période de chevauchement
  overlap_start DATE NOT NULL,
  overlap_end DATE NOT NULL,
  overlap_nights INTEGER NOT NULL,
  
  -- Sévérité
  severity VARCHAR(50) NOT NULL, -- 'critical', 'warning', 'info'
  
  -- Statut
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive'
  
  -- Résolution
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conflicts_loft_id ON airbnb_conflicts(loft_id);
CREATE INDEX idx_conflicts_status ON airbnb_conflicts(status);
CREATE INDEX idx_conflicts_severity ON airbnb_conflicts(severity);
CREATE INDEX idx_conflicts_created_at ON airbnb_conflicts(created_at);

COMMENT ON TABLE airbnb_conflicts IS 'Conflits de réservation détectés';
```

---

## 🔄 Flux de Données Détaillé

### Flux Principal: Synchronisation Automatique

```
┌─────────────────────────────────────────────────────────────┐
│ 1. iCal Watcher (toutes les 5 min)                         │
│    - Fetch iCal URLs de tous les lofts actifs              │
│    - Détecte les changements (hash comparison)             │
│    - Si changement détecté → Déclenche Targeted Scraper    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Targeted Scraper (on-demand)                            │
│    - Scrape UNIQUEMENT le loft qui a changé                │
│    - Récupère les détails complets (CloakBrowser)          │
│    - Parse les données                                      │
│    - Prépare le payload JSON                                │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS POST
┌─────────────────────────────────────────────────────────────┐
│ 3. API Next.js: POST /api/airbnb/sync                      │
│    ├─ Authentification (API Key)                           │
│    ├─ Validation (Zod schema)                              │
│    ├─ Génération sync_batch_id                             │
│    └─ Log: airbnb_sync_logs (status='started')             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Insertion dans Staging                                   │
│    INSERT INTO airbnb_reservations_staging                  │
│    - airbnb_id, listing_id, raw_data, ...                  │
│    - mapping_status='pending'                               │
│    - validation_status='pending'                            │
│    - reconciliation_status='pending'                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Validation des Données                                   │
│    - Vérifier montants > 0                                  │
│    - Vérifier dates cohérentes (check_in < check_out)      │
│    - Vérifier guest_count > 0                               │
│    - Traduire statut FR → EN                                │
│    → Si invalid: validation_status='invalid' + log errors   │
│    → Si valid: validation_status='valid'                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Mapping listing_id → loft_id                             │
│    SELECT id FROM lofts WHERE airbnb_listing_id = :listing  │
│    → Si trouvé: loft_id + mapping_status='mapped'           │
│    → Si non trouvé: mapping_status='failed' + notification  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Réconciliation avec reservations                         │
│    Vérifier si réservation existe déjà:                     │
│    SELECT id FROM reservations                              │
│    WHERE airbnb_confirmation_code = :airbnb_id              │
│                                                             │
│    → Si existe: UPDATE + reconciliation_action='update'     │
│    → Si n'existe pas: INSERT + reconciliation_action='create'│
│    → reservation_id = UUID de la réservation                │
│    → reconciliation_status='created' ou 'updated'           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Détection des Conflits                                   │
│    SELECT * FROM reservations                               │
│    WHERE loft_id = :loft_id                                 │
│    AND status IN ('confirmed', 'pending')                   │
│    AND (check_in_date < :new_checkout                       │
│         AND check_out_date > :new_checkin)                  │
│                                                             │
│    → Si conflit: INSERT INTO airbnb_conflicts               │
│    → Notification in-app + email (si configuré)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Notifications                                             │
│    - Conflit détecté → Notification priority='high'         │
│    - Listing ID non mappé → Notification priority='medium'  │
│    - Erreur de validation → Log seulement                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Finalisation                                             │
│     UPDATE airbnb_sync_logs                                 │
│     SET status='success',                                   │
│         completed_at=NOW(),                                 │
│         duration_ms=...,                                    │
│         reservations_created=...,                           │
│         reservations_updated=...,                           │
│         conflicts_detected=...                              │
│     WHERE sync_batch_id = :batch_id                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Réponse API                                              │
│     {                                                       │
│       "success": true,                                      │
│       "sync_batch_id": "uuid",                              │
│       "processed": 1,                                       │
│       "created": 1,                                         │
│       "updated": 0,                                         │
│       "conflicts": 0,                                       │
│       "errors": [],                                         │
│       "warnings": []                                        │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### POST /api/airbnb/sync

**Description:** Endpoint principal pour recevoir les données du script Python.

**Authentification:** API Key dans header `Authorization: Bearer {API_KEY}`

**Rate Limiting:** 100 requêtes/minute

**Timeout:** 30 secondes

**Request Body:**

```typescript
interface AirbnbSyncRequest {
  reservations: Array<{
    id: string;                    // Code confirmation Airbnb
    listing_id: string;            // ID numérique Airbnb
    statut: string;                // FR: "Confirmée", "En attente", etc.
    voyageur: string;
    nb_voyageurs: number;
    date_arrivee: string;          // ISO 8601
    date_depart: string;           // ISO 8601
    nb_nuits: number;
    montant_total: number;
    devise: string;
    base_price?: number;
    cleaning_fee?: number;
    service_fee?: number;
    taxes?: number;
    guest_email?: string;
    guest_phone?: string;
    guest_nationality?: string;
    special_requests?: string;
  }>;
  sync_metadata: {
    sync_type: 'ical_watcher' | 'targeted' | 'full' | 'manual';
    timestamp: string;             // ISO 8601
    script_version: string;
  };
}
```

**Response:**

```typescript
interface AirbnbSyncResponse {
  success: boolean;
  sync_batch_id: string;
  metrics: {
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    conflicts: number;
  };
  errors: Array<{
    reservation_id: string;
    error: string;
    details?: any;
  }>;
  warnings: Array<{
    reservation_id: string;
    warning: string;
    details?: any;
  }>;
}
```

**Validation Schema (Zod):**

```typescript
import { z } from 'zod';

const ReservationSchema = z.object({
  id: z.string().min(1),
  listing_id: z.string().min(1),
  statut: z.string(),
  voyageur: z.string(),
  nb_voyageurs: z.number().int().positive(),
  date_arrivee: z.string().datetime(),
  date_depart: z.string().datetime(),
  nb_nuits: z.number().int().positive(),
  montant_total: z.number().nonnegative(),
  devise: z.string().length(3),
  base_price: z.number().nonnegative().optional(),
  cleaning_fee: z.number().nonnegative().optional(),
  service_fee: z.number().nonnegative().optional(),
  taxes: z.number().nonnegative().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  guest_nationality: z.string().length(2).optional(),
  special_requests: z.string().optional(),
});

const SyncRequestSchema = z.object({
  reservations: z.array(ReservationSchema).min(1).max(100),
  sync_metadata: z.object({
    sync_type: z.enum(['ical_watcher', 'targeted', 'full', 'manual']),
    timestamp: z.string().datetime(),
    script_version: z.string(),
  }),
});
```

---

## 🐳 Configuration Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  ical-watcher:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: airbnb-ical-watcher
    environment:
      - SERVICE_TYPE=ical_watcher
      - SCHEDULE=*/5 * * * *  # Toutes les 5 minutes
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NEXTJS_API_URL=${NEXTJS_API_URL}
      - NEXTJS_API_KEY=${NEXTJS_API_KEY}
      - SCRIPT_VERSION=2.0.0
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import sys; sys.exit(0)"]
      interval: 5m
      timeout: 10s
      retries: 3

  targeted-scraper:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: airbnb-targeted-scraper
    environment:
      - SERVICE_TYPE=targeted_scraper
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NEXTJS_API_URL=${NEXTJS_API_URL}
      - NEXTJS_API_KEY=${NEXTJS_API_KEY}
      - AIRBNB_EMAIL=${AIRBNB_EMAIL}
      - AIRBNB_PASSWORD=${AIRBNB_PASSWORD}
      - CLOAKBROWSER_API_KEY=${CLOAKBROWSER_API_KEY}
      - SCRIPT_VERSION=2.0.0
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    depends_on:
      - ical-watcher

  full-scraper:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: airbnb-full-scraper
    environment:
      - SERVICE_TYPE=full_scraper
      - SCHEDULE=0 4 * * *  # 4h du matin GMT+1
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NEXTJS_API_URL=${NEXTJS_API_URL}
      - NEXTJS_API_KEY=${NEXTJS_API_KEY}
      - AIRBNB_EMAIL=${AIRBNB_EMAIL}
      - AIRBNB_PASSWORD=${AIRBNB_PASSWORD}
      - CLOAKBROWSER_API_KEY=${CLOAKBROWSER_API_KEY}
      - SCRIPT_VERSION=2.0.0
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le script
COPY airbnb_scraper.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Créer les dossiers
RUN mkdir -p /app/logs /app/data

# Healthcheck
HEALTHCHECK --interval=5m --timeout=10s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

ENTRYPOINT ["./entrypoint.sh"]
```

### entrypoint.sh

```bash
#!/bin/bash
set -e

echo "Starting Airbnb Scraper Service: $SERVICE_TYPE"

case "$SERVICE_TYPE" in
  "ical_watcher")
    echo "Starting iCal Watcher (every 5 minutes)"
    while true; do
      python airbnb_scraper.py --mode ical_watcher
      sleep 300  # 5 minutes
    done
    ;;
  
  "targeted_scraper")
    echo "Starting Targeted Scraper (on-demand via trigger file)"
    while true; do
      if [ -f /app/data/trigger_targeted.txt ]; then
        LOFT_ID=$(cat /app/data/trigger_targeted.txt)
        python airbnb_scraper.py --mode targeted --loft-id "$LOFT_ID"
        rm /app/data/trigger_targeted.txt
      fi
      sleep 10
    done
    ;;
  
  "full_scraper")
    echo "Starting Full Scraper (daily at 4am GMT+1)"
    # Utiliser cron ou attendre l'heure
    while true; do
      CURRENT_HOUR=$(date +%H)
      if [ "$CURRENT_HOUR" == "04" ]; then
        python airbnb_scraper.py --mode full
        sleep 3600  # Attendre 1h pour éviter de relancer
      fi
      sleep 60
    done
    ;;
  
  *)
    echo "Unknown SERVICE_TYPE: $SERVICE_TYPE"
    exit 1
    ;;
esac
```

---

## ☁️ Déploiement Oracle Cloud Free Tier

### Spécifications VM

**VM Recommandée:** ARM Ampere A1

- **CPU:** 4 OCPU (gratuit à vie)
- **RAM:** 24 GB (gratuit à vie)
- **Storage:** 200 GB (gratuit à vie)
- **OS:** Ubuntu 22.04 LTS
- **Réseau:** 10 TB/mois (gratuit)

### Étapes de Déploiement

#### 1. Créer la VM sur Oracle Cloud

```bash
# Se connecter à Oracle Cloud Console
# Compute → Instances → Create Instance
# - Shape: VM.Standard.A1.Flex (ARM)
# - OCPU: 4
# - Memory: 24 GB
# - OS: Ubuntu 22.04
# - SSH Key: Ajouter votre clé publique
```

#### 2. Configurer le Firewall

```bash
# Ouvrir les ports nécessaires
# Networking → Virtual Cloud Networks → Security Lists
# Ingress Rules:
# - Port 22 (SSH)
# - Port 80 (HTTP) - optionnel
# - Port 443 (HTTPS) - optionnel
```

#### 3. Se Connecter à la VM

```bash
ssh ubuntu@<VM_PUBLIC_IP>
```

#### 4. Installer Docker et Docker Compose

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier
docker --version
docker-compose --version
```

#### 5. Déployer les Services

```bash
# Créer le dossier de travail
mkdir -p ~/airbnb-scraper
cd ~/airbnb-scraper

# Copier les fichiers (depuis votre machine locale)
# scp -r d:\Airbnb_transfer_v2\* ubuntu@<VM_IP>:~/airbnb-scraper/

# Créer le fichier .env
cat > .env << EOF
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=votre-api-key-generee
AIRBNB_EMAIL=votre-email@airbnb.com
AIRBNB_PASSWORD=votre-mot-de-passe
CLOAKBROWSER_API_KEY=votre-cloakbrowser-key
EOF

# Démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

#### 6. Monitoring

```bash
# Vérifier le statut
docker-compose ps

# Logs en temps réel
docker-compose logs -f ical-watcher
docker-compose logs -f targeted-scraper
docker-compose logs -f full-scraper

# Redémarrer un service
docker-compose restart ical-watcher

# Arrêter tous les services
docker-compose down

# Mettre à jour
git pull  # ou scp les nouveaux fichiers
docker-compose up -d --build
```

---

## 🔐 Sécurité

### Variables d'Environnement

**Next.js (Vercel):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Airbnb API
AIRBNB_API_SECRET=generer-avec-openssl-rand-base64-32
AIRBNB_SYNC_ENABLED=true

# Alertes
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_EMAIL=admin@votredomaine.com
ALERT_FROM_EMAIL=alerts@votredomaine.com
NEXT_PUBLIC_APP_URL=https://votreapp.vercel.app
```

**Docker (Oracle Cloud):**

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# Next.js API
NEXTJS_API_URL=https://votreapp.vercel.app
NEXTJS_API_KEY=meme-que-AIRBNB_API_SECRET

# Airbnb Credentials
AIRBNB_EMAIL=votre-email@airbnb.com
AIRBNB_PASSWORD=votre-mot-de-passe

# CloakBrowser
CLOAKBROWSER_API_KEY=votre-cloakbrowser-key

# Script
SCRIPT_VERSION=2.0.0
```

### Génération de l'API Key

```bash
# Sur Windows PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Ou en ligne
# https://generate-random.org/api-token-generator
```

---

## 📊 Monitoring et Alertes

### Dashboard Admin

**Page:** `/admin/airbnb/monitoring`

**Métriques affichées:**

1. **Vue d'ensemble (dernières 24h)**
   - Nombre de syncs réussis/échoués
   - Délai moyen de synchronisation
   - Nombre de réservations créées/mises à jour
   - Nombre de conflits détectés

2. **Graphiques (derniers 7 jours)**
   - Syncs par jour (ligne)
   - Taux de succès (barre)
   - Délai de sync (ligne)
   - Conflits par jour (barre)

3. **Liste des derniers syncs**
   - Timestamp
   - Type (ical_watcher, targeted, full)
   - Statut (success, partial, failed)
   - Métriques (créées, mises à jour, erreurs)
   - Actions (voir détails, rejouer)

4. **Alertes actives**
   - Listing IDs non mappés
   - Conflits non résolus
   - Erreurs récurrentes

### Notifications In-App

**Types de notifications:**

1. **Conflit de réservation** (priority='high')
   ```typescript
   {
     type: 'airbnb_conflict',
     title_key: 'airbnb.conflict.title',
     message_key: 'airbnb.conflict.message',
     message_payload: {
       loft_name: 'Alger Centre',
       date_start: '2026-05-20',
       date_end: '2026-05-25'
     },
     link: '/admin/airbnb/conflicts',
     priority: 'high'
   }
   ```

2. **Listing ID non mappé** (priority='medium')
   ```typescript
   {
     type: 'airbnb_unmapped_listing',
     title_key: 'airbnb.unmapped.title',
     message_key: 'airbnb.unmapped.message',
     message_payload: {
       listing_id: '12345678',
       reservation_count: 3
     },
     link: '/admin/airbnb/mapping',
     priority: 'medium'
   }
   ```

3. **Erreur de synchronisation** (priority='medium')
   ```typescript
   {
     type: 'airbnb_sync_error',
     title_key: 'airbnb.sync_error.title',
     message_key: 'airbnb.sync_error.message',
     message_payload: {
       sync_type: 'full',
       error_count: 5
     },
     link: '/admin/airbnb/monitoring',
     priority: 'medium'
   }
   ```

### Alertes Email (Paramétrables)

**Configuration:** `/admin/settings/airbnb-alerts`

**Options:**
- ✅ Activer/désactiver les emails
- 📧 Emails pour conflits
- 📧 Emails pour erreurs techniques
- 📧 Emails pour rapports quotidiens
- ⏰ Heure du rapport quotidien

**Templates:**

1. **Conflit de réservation**
   - Sujet: `🚨 Conflit de réservation - {loft_name}`
   - Contenu: Détails des 2 réservations, période de chevauchement, lien vers le calendrier

2. **Listing ID non mappé**
   - Sujet: `⚠️ Listing ID Airbnb non mappé - {listing_id}`
   - Contenu: Listing ID, nombre de réservations en attente, lien vers la config

3. **Rapport quotidien**
   - Sujet: `📊 Rapport Airbnb - {date}`
   - Contenu: Métriques du jour, syncs réussis/échoués, conflits, actions requises

---

## 🧪 Tests

### Tests Unitaires

**Fichiers à tester:**

1. **`lib/utils/airbnb-status-translator.ts`**
   ```typescript
   describe('translateAirbnbStatus', () => {
     it('should translate French statuses to English', () => {
       expect(translateStatus('Confirmée')).toBe('confirmed');
       expect(translateStatus('En attente')).toBe('pending');
       expect(translateStatus('Annulée')).toBe('cancelled');
     });
     
     it('should handle unknown statuses', () => {
       expect(translateStatus('Inconnu')).toBe('pending');
     });
   });
   ```

2. **`lib/services/airbnb-sync-service.ts`**
   ```typescript
   describe('AirbnbSyncService', () => {
     describe('validateReservation', () => {
       it('should validate correct data', () => {
         const result = validateReservation(validData);
         expect(result.valid).toBe(true);
       });
       
       it('should reject invalid amounts', () => {
         const result = validateReservation({ ...validData, montant_total: -100 });
         expect(result.valid).toBe(false);
         expect(result.errors).toContain('Invalid amount');
       });
     });
     
     describe('mapListingIdToLoftId', () => {
       it('should map known listing IDs', async () => {
         const loftId = await mapListingId('12345678');
         expect(loftId).toBeDefined();
       });
       
       it('should return null for unknown listing IDs', async () => {
         const loftId = await mapListingId('99999999');
         expect(loftId).toBeNull();
       });
     });
   });
   ```

### Tests d'Intégration

**Scénarios à tester:**

1. **Nouvelle réservation**
   ```typescript
   it('should create a new reservation from Airbnb data', async () => {
     const response = await fetch('/api/airbnb/sync', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         reservations: [newReservationData],
         sync_metadata: { ... }
       })
     });
     
     expect(response.status).toBe(200);
     const data = await response.json();
     expect(data.metrics.created).toBe(1);
     
     // Vérifier dans la DB
     const reservation = await getReservation(newReservationData.id);
     expect(reservation).toBeDefined();
     expect(reservation.source).toBe('airbnb_scraper');
   });
   ```

2. **Mise à jour de réservation**
   ```typescript
   it('should update an existing reservation', async () => {
     // Créer une réservation
     await createReservation(existingData);
     
     // Mettre à jour via l'API
     const response = await fetch('/api/airbnb/sync', {
       method: 'POST',
       body: JSON.stringify({
         reservations: [updatedData],
         sync_metadata: { ... }
       })
     });
     
     expect(response.status).toBe(200);
     const data = await response.json();
     expect(data.metrics.updated).toBe(1);
     
     // Vérifier la mise à jour
     const reservation = await getReservation(existingData.id);
     expect(reservation.guest_count).toBe(updatedData.nb_voyageurs);
   });
   ```

3. **Détection de conflit**
   ```typescript
   it('should detect reservation conflicts', async () => {
     // Créer une réservation existante
     await createReservation({
       loft_id: 'loft-1',
       check_in_date: '2026-05-20',
       check_out_date: '2026-05-25',
       status: 'confirmed'
     });
     
     // Tenter de créer une réservation qui chevauche
     const response = await fetch('/api/airbnb/sync', {
       method: 'POST',
       body: JSON.stringify({
         reservations: [{
           loft_id: 'loft-1',
           check_in_date: '2026-05-22',
           check_out_date: '2026-05-27',
           status: 'confirmed'
         }],
         sync_metadata: { ... }
       })
     });
     
     expect(response.status).toBe(200);
     const data = await response.json();
     expect(data.metrics.conflicts).toBe(1);
     
     // Vérifier la notification
     const notifications = await getNotifications();
     expect(notifications).toHaveLength(1);
     expect(notifications[0].type).toBe('airbnb_conflict');
   });
   ```

### Tests End-to-End

**Scénario complet:**

```typescript
describe('Airbnb Sync E2E', () => {
  it('should sync a reservation from Python script to database', async () => {
    // 1. Configurer le mapping
    await updateLoft('loft-1', { airbnb_listing_id: '12345678' });
    
    // 2. Simuler l'appel du script Python
    const response = await fetch('/api/airbnb/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reservations: [{
          id: 'HMTEST123',
          listing_id: '12345678',
          statut: 'Confirmée',
          voyageur: 'John Doe',
          nb_voyageurs: 2,
          date_arrivee: '2026-05-20T14:00:00Z',
          date_depart: '2026-05-25T11:00:00Z',
          nb_nuits: 5,
          montant_total: 45000.00,
          devise: 'DZD'
        }],
        sync_metadata: {
          sync_type: 'targeted',
          timestamp: new Date().toISOString(),
          script_version: '2.0.0'
        }
      })
    });
    
    // 3. Vérifier la réponse
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metrics.created).toBe(1);
    
    // 4. Vérifier dans staging
    const staging = await getStagingReservation('HMTEST123');
    expect(staging).toBeDefined();
    expect(staging.mapping_status).toBe('mapped');
    expect(staging.validation_status).toBe('valid');
    expect(staging.reconciliation_status).toBe('created');
    
    // 5. Vérifier dans reservations
    const reservation = await getReservationByAirbnbCode('HMTEST123');
    expect(reservation).toBeDefined();
    expect(reservation.loft_id).toBe('loft-1');
    expect(reservation.guest_name).toBe('John Doe');
    expect(reservation.status).toBe('confirmed');
    expect(reservation.source).toBe('airbnb_scraper');
    
    // 6. Vérifier les logs
    const logs = await getSyncLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('success');
    expect(logs[0].reservations_created).toBe(1);
  });
});
```

---

## 📝 Prochaines Étapes

### Phase 1: MVP (3 jours)

1. **Jour 1: Infrastructure DB + API**
   - ✅ Créer les 5 migrations SQL
   - ✅ Créer l'API endpoint `/api/airbnb/sync`
   - ✅ Implémenter la validation (Zod)
   - ✅ Implémenter la traduction des statuts
   - ✅ Tests unitaires

2. **Jour 2: Intégration Python + Docker**
   - ✅ Modifier le script Python pour appeler l'API
   - ✅ Créer le Docker Compose
   - ✅ Tester en local
   - ✅ Configurer les variables d'environnement

3. **Jour 3: Déploiement + Tests**
   - ✅ Provisionner Oracle Cloud VM
   - ✅ Déployer les services Docker
   - ✅ Tests end-to-end
   - ✅ Import historique (1 an)

### Phase 2: Stabilisation (3 jours)

4. **Jour 4: Gestion des Erreurs + Interface Admin**
   - ✅ Retry automatique avec backoff
   - ✅ Interface admin de mapping
   - ✅ Tests

5. **Jour 5: Monitoring**
   - ✅ Dashboard de monitoring
   - ✅ Détection des conflits
   - ✅ Tests

6. **Jour 6: Alertes + Documentation**
   - ✅ Notifications in-app
   - ✅ Alertes email paramétrables
   - ✅ Documentation complète

### Phase 3: Optimisation (1 jour)

7. **Jour 7: Fonctionnalités Avancées**
   - ✅ Import CSV en masse du mapping
   - ✅ Export des données
   - ✅ Statistiques avancées

---

**Design créé par:** Kiro AI  
**Date:** 2026-05-17  
**Version:** 1.0.0  
**Status:** Final - Prêt pour implémentation
