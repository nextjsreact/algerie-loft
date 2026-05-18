# API Endpoint: POST /api/airbnb/sync

## Description

Endpoint sécurisé pour recevoir les données de réservation du script Python Airbnb Scraper v2.0.0 et les synchroniser avec la base de données Supabase.

## Authentification

**Type:** API Key (Bearer Token)

**Header:**
```
Authorization: Bearer {AIRBNB_API_SECRET}
```

## Rate Limiting

- **Limite:** 100 requêtes par minute
- **Headers de réponse:**
  - `X-RateLimit-Limit`: Nombre maximum de requêtes
  - `X-RateLimit-Remaining`: Nombre de requêtes restantes
  - `X-RateLimit-Reset`: Timestamp de réinitialisation

## Request

### Method
```
POST /api/airbnb/sync
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {AIRBNB_API_SECRET}
```

### Body Schema

```typescript
{
  "reservations": [
    {
      "id": string,                    // Code confirmation Airbnb (ex: "HMABCD123")
      "listing_id": string,            // ID numérique Airbnb (ex: "12345678")
      "statut": string,                // FR: "Confirmée", "En attente", "Annulée", etc.
      "voyageur": string,              // Nom du voyageur
      "nb_voyageurs": number,          // Nombre de voyageurs (> 0)
      "date_arrivee": string,          // Format: YYYY-MM-DD
      "date_depart": string,           // Format: YYYY-MM-DD
      "nb_nuits": number,              // Nombre de nuits (> 0)
      "montant_total": number,         // Montant total (>= 0)
      "devise": string,                // Code devise (3 caractères, ex: "DZD")
      "base_price"?: number,           // Prix de base (optionnel, >= 0)
      "cleaning_fee"?: number,         // Frais de ménage (optionnel, >= 0)
      "service_fee"?: number,          // Frais de service (optionnel, >= 0)
      "taxes"?: number,                // Taxes (optionnel, >= 0)
      "guest_email"?: string,          // Email du voyageur (optionnel, format email)
      "guest_phone"?: string,          // Téléphone (optionnel)
      "guest_nationality"?: string,    // Code pays (optionnel, 2 caractères, ex: "FR")
      "special_requests"?: string      // Demandes spéciales (optionnel)
    }
  ],
  "sync_metadata": {
    "sync_type": "ical_watcher" | "targeted" | "full" | "manual",
    "timestamp": string,               // Format: ISO 8601 (ex: "2026-05-17T21:00:00Z")
    "script_version": string           // Version du script (ex: "2.0.0")
  }
}
```

### Validation Rules

- **reservations**: 1 à 100 réservations par requête
- **id**: Non vide
- **listing_id**: Non vide
- **statut**: Non vide
- **voyageur**: Non vide
- **nb_voyageurs**: Entier positif
- **date_arrivee**: Format YYYY-MM-DD
- **date_depart**: Format YYYY-MM-DD (doit être après date_arrivee)
- **nb_nuits**: Entier positif
- **montant_total**: >= 0
- **devise**: Exactement 3 caractères
- **guest_email**: Format email valide (si fourni)
- **guest_nationality**: Exactement 2 caractères (si fourni)

### Example Request

```bash
curl -X POST https://votreapp.vercel.app/api/airbnb/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer votre-api-key-secrete" \
  -d '{
    "reservations": [
      {
        "id": "HMABCD123",
        "listing_id": "12345678",
        "statut": "Confirmée",
        "voyageur": "John Doe",
        "nb_voyageurs": 2,
        "date_arrivee": "2026-05-20",
        "date_depart": "2026-05-25",
        "nb_nuits": 5,
        "montant_total": 45000.00,
        "devise": "DZD",
        "base_price": 40000.00,
        "cleaning_fee": 3000.00,
        "service_fee": 1500.00,
        "taxes": 500.00,
        "guest_email": "john@example.com",
        "guest_phone": "+213555123456",
        "guest_nationality": "FR",
        "special_requests": "Arrivée tardive"
      }
    ],
    "sync_metadata": {
      "sync_type": "targeted",
      "timestamp": "2026-05-17T21:00:00Z",
      "script_version": "2.0.0"
    }
  }'
```

## Response

### Success Response (200 OK)

```typescript
{
  "success": true,
  "sync_batch_id": string,           // UUID du batch de synchronisation
  "metrics": {
    "processed": number,             // Nombre de réservations traitées
    "created": number,               // Nombre de réservations créées
    "updated": number,               // Nombre de réservations mises à jour
    "skipped": number,               // Nombre de réservations ignorées
    "failed": number,                // Nombre de réservations échouées
    "conflicts": number              // Nombre de conflits détectés
  },
  "errors": [
    {
      "reservation_id": string,      // ID de la réservation en erreur
      "error": string,               // Message d'erreur
      "details": any                 // Détails supplémentaires
    }
  ],
  "warnings": [
    {
      "reservation_id": string,      // ID de la réservation
      "warning": string,             // Message d'avertissement
      "details": any                 // Détails supplémentaires
    }
  ]
}
```

### Example Success Response

```json
{
  "success": true,
  "sync_batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "processed": 1,
    "created": 1,
    "updated": 0,
    "skipped": 0,
    "failed": 0,
    "conflicts": 0
  },
  "errors": [],
  "warnings": []
}
```

### Example Partial Success Response

```json
{
  "success": true,
  "sync_batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "processed": 2,
    "created": 1,
    "updated": 0,
    "skipped": 1,
    "failed": 0,
    "conflicts": 0
  },
  "errors": [],
  "warnings": [
    {
      "reservation_id": "HMXYZ789",
      "warning": "Listing ID 87654321 not mapped to any loft",
      "details": {
        "listing_id": "87654321"
      }
    }
  ]
}
```

## Error Responses

### 400 Bad Request - Invalid JSON

```json
{
  "success": false,
  "error": "Invalid JSON payload"
}
```

### 400 Bad Request - Validation Failed

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": false,
      "exact": false,
      "message": "Guest count must be positive",
      "path": ["reservations", 0, "nb_voyageurs"]
    }
  ]
}
```

### 401 Unauthorized - Missing API Key

```json
{
  "success": false,
  "error": "Missing or invalid Authorization header"
}
```

### 401 Unauthorized - Invalid API Key

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### 429 Too Many Requests - Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 45 seconds."
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1715978400000
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

### 503 Service Unavailable - Sync Disabled

```json
{
  "success": false,
  "error": "Airbnb synchronization is disabled"
}
```

## Workflow

1. **Authentification:** Vérification de l'API Key
2. **Rate Limiting:** Vérification de la limite de requêtes
3. **Validation:** Validation du payload JSON avec Zod
4. **Logging:** Création d'un log de synchronisation (status='started')
5. **Traitement:**
   - Pour chaque réservation:
     - Parser et valider les données
     - Traduire le statut FR → EN
     - Mapper listing_id → loft_id
     - Insérer dans la table staging
     - Réconcilier avec la table reservations (create/update)
     - Détecter les conflits
6. **Finalisation:** Mise à jour du log (status='success'/'partial'/'failed')
7. **Réponse:** Retour des métriques, erreurs et avertissements

## Tables Utilisées

### airbnb_reservations_staging
Table de staging pour validation et réconciliation.

### reservations
Table principale des réservations (source de vérité).

### lofts
Table des lofts (contient le mapping airbnb_listing_id).

### airbnb_sync_logs
Logs de synchronisation pour monitoring.

### airbnb_conflicts
Conflits de réservation détectés.

## Configuration

### Variables d'Environnement

```bash
# Activer/désactiver la synchronisation
AIRBNB_SYNC_ENABLED=true

# API Key pour authentification (générer avec openssl rand -base64 32)
AIRBNB_API_SECRET=votre-api-key-secrete-generee

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Génération de l'API Key

**Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Linux/macOS:**
```bash
openssl rand -base64 32
```

## Monitoring

### Logs de Synchronisation

Consultez la table `airbnb_sync_logs` pour voir l'historique des synchronisations :

```sql
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_failed,
  conflicts_detected,
  duration_ms,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

### Réservations en Staging

Consultez la table `airbnb_reservations_staging` pour voir les réservations en cours de traitement :

```sql
SELECT 
  airbnb_id,
  listing_id,
  mapping_status,
  validation_status,
  reconciliation_status,
  created_at
FROM airbnb_reservations_staging
WHERE reconciliation_status = 'pending'
ORDER BY created_at DESC;
```

### Conflits Détectés

Consultez la table `airbnb_conflicts` pour voir les conflits :

```sql
SELECT 
  loft_id,
  reservation_1_id,
  reservation_2_id,
  overlap_start,
  overlap_end,
  overlap_nights,
  severity,
  status
FROM airbnb_conflicts
WHERE status = 'open'
ORDER BY created_at DESC;
```

## Troubleshooting

### Listing ID non mappé

**Symptôme:** Warning "Listing ID not mapped to any loft"

**Solution:**
1. Accéder à `/admin/airbnb/mapping`
2. Trouver le loft correspondant
3. Ajouter l'`airbnb_listing_id`
4. Relancer la synchronisation

### Validation échouée

**Symptôme:** Error "Validation failed"

**Solution:**
1. Vérifier les détails de l'erreur dans la réponse
2. Corriger les données dans le script Python
3. Relancer la synchronisation

### Conflit de réservation

**Symptôme:** Conflit détecté dans `airbnb_conflicts`

**Solution:**
1. Vérifier les 2 réservations en conflit
2. Identifier la réservation incorrecte
3. Annuler ou modifier la réservation
4. Marquer le conflit comme résolu

## Security

- ✅ API Key obligatoire (Bearer Token)
- ✅ Rate limiting (100 req/min)
- ✅ Validation stricte du payload (Zod)
- ✅ Logs détaillés (sans données sensibles)
- ✅ HTTPS uniquement (Vercel)
- ✅ Variables d'environnement sécurisées

## Performance

- **Timeout:** 30 secondes
- **Max reservations:** 100 par requête
- **Rate limit:** 100 requêtes/minute
- **Temps de réponse moyen:** < 2 secondes pour 10 réservations

## Support

Pour toute question ou problème, consultez :
- Documentation complète: `docs/AIRBNB_SCRAPER_INTEGRATION.md`
- Spec: `.kiro/specs/airbnb-python-scraper-integration/`
- Logs: Table `airbnb_sync_logs`
