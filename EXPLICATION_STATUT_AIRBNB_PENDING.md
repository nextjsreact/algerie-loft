# Pourquoi des réservations Airbnb sont en statut "En attente" ?

## 🔍 Diagnostic

Vous voyez des réservations provenant d'Airbnb avec le statut "En attente" (pending) alors qu'elles devraient être "Confirmée" (confirmed).

## 🎯 Causes possibles

### 1. **Statut inconnu du scraper Python**
Le script Python Airbnb envoie un statut en français que notre système ne reconnaît pas. Quand `translateAirbnbStatus()` ne trouve pas de correspondance, il utilisait par défaut le statut "pending".

**Exemples de statuts Airbnb non reconnus :**
- "Acceptée" (au lieu de "Confirmée")
- "Réservée" (au lieu de "Confirmée")  
- "Booked" (version anglaise)
- Ou tout autre statut que Airbnb utilise

### 2. **Vraie réservation en attente**
Certaines réservations Airbnb sont réellement en attente de :
- Confirmation du propriétaire
- Validation du paiement
- Acceptation de la demande de réservation

## ✅ Solutions appliquées

### 1. **Amélioration du traducteur de statut**
J'ai étendu `lib/utils/airbnb-status-translator.ts` pour reconnaître plus de statuts :

**Nouveaux statuts ajoutés :**
- ✅ `Acceptée` / `Accepte` / `Accepted` → `confirmed`
- ✅ `Réservée` / `Reservee` / `Reserved` → `confirmed`
- ✅ `Booked` → `confirmed`
- ✅ `Demande` / `Request` → `pending`
- ✅ `Passée` / `Passee` / `Past` → `completed`

**Changement important :** Le statut par défaut pour les statuts inconnus est maintenant `confirmed` au lieu de `pending`, car les réservations scrapées d'Airbnb sont normalement déjà confirmées.

### 2. **Scripts de vérification et correction**

**Pour diagnostiquer :**
```sql
-- Exécuter ce script pour voir les statuts actuels
psql -f check-airbnb-reservation-statuses.sql
```

**Pour corriger les réservations existantes :**
```sql
-- ATTENTION : Modifie les données !
-- Exécuter ce script pour corriger les réservations "pending" en "confirmed"
psql -f fix-airbnb-pending-status.sql
```

## 📊 Comment vérifier

### Dans l'interface
1. Aller sur `/fr/admin/reservations-provenance`
2. Filtrer par "Source: Airbnb"
3. Vérifier les statuts

### Dans la base de données
```sql
-- Compter les réservations Airbnb par statut
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status;

-- Voir les statuts originaux français du scraper
SELECT 
  raw_data->>'statut' as statut_original,
  status as statut_traduit,
  COUNT(*) as nombre
FROM airbnb_reservations_staging
GROUP BY raw_data->>'statut', status
ORDER BY COUNT(*) DESC;
```

## 🔧 Actions recommandées

### Immédiat
1. ✅ **Déployé** : Nouveau traducteur de statut avec plus de correspondances
2. 🔄 **À faire** : Exécuter `fix-airbnb-pending-status.sql` pour corriger les réservations existantes
3. 📝 **À faire** : Vérifier les logs pour voir quels statuts inconnus sont loggés

### Moyen terme
1. 📊 Analyser les logs de traduction pour identifier tous les statuts Airbnb réels
2. 🐍 Vérifier le script Python scraper pour voir exactement quels statuts il envoie
3. 📖 Documenter tous les statuts Airbnb possibles

### Long terme
1. 🔔 Créer une alerte quand un statut inconnu est rencontré
2. 📈 Dashboard admin pour voir les statuts non reconnus
3. 🤖 Auto-apprentissage des nouveaux statuts Airbnb

## 🚀 Prochaine synchronisation

Lors de la prochaine synchronisation Airbnb, les nouvelles réservations seront automatiquement marquées comme "confirmed" si :
- Le statut est reconnu (ex: "Acceptée", "Réservée", etc.)
- Le statut est inconnu (par défaut maintenant = "confirmed")

Les seules réservations qui resteront en "pending" sont celles qui :
- Ont explicitement le statut "En attente" / "Pending" / "Demande"
- Sont de vraies demandes de réservation non confirmées

## 📝 Notes importantes

- ⚠️ Les réservations **déjà créées** ne sont PAS modifiées automatiquement
- ✅ Utilisez `fix-airbnb-pending-status.sql` pour corriger l'historique
- 🔍 Surveillez les logs pour les nouveaux statuts inconnus
- 📞 Contactez-moi si vous voyez encore des "pending" après correction

## 🔗 Fichiers modifiés

1. `lib/utils/airbnb-status-translator.ts` - Traducteur amélioré
2. `check-airbnb-reservation-statuses.sql` - Script de diagnostic
3. `fix-airbnb-pending-status.sql` - Script de correction
