# Guide de Support Technique - Multi-Role Booking System

## Vue d'Ensemble

Ce guide est destiné à l'équipe de support technique pour diagnostiquer et résoudre les problèmes de la plateforme multi-rôles.

## Table des Matières

1. [Outils de Diagnostic](#outils-de-diagnostic)
2. [Problèmes d'Authentification](#problèmes-dauthentification)
3. [Erreurs de Base de Données](#erreurs-de-base-de-données)
4. [Problèmes de Performance](#problèmes-de-performance)
5. [Erreurs de Paiement](#erreurs-de-paiement)
6. [Problèmes de Notifications](#problèmes-de-notifications)
7. [Escalade et Procédures](#escalade-et-procédures)

## Outils de Diagnostic

### Logs et Monitoring

```bash
# Accès aux logs de production
kubectl logs -f deployment/booking-system-app

# Logs de base de données
psql $DATABASE_URL -c "SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour';"

# Métriques de performance
curl -s http://localhost:3000/api/health | jq
```

### Commandes de Diagnostic

```bash
# Vérifier l'état des services
docker-compose ps

# Tester la connectivité base de données
pg_isready -h $DB_HOST -p $DB_PORT

# Vérifier les variables d'environnement
env | grep -E "(SUPABASE|STRIPE|NEXTAUTH)"
```

### Dashboard de Monitoring

- **URL** : `/admin/monitoring`
- **Métriques clés** :
  - Temps de réponse API
  - Taux d'erreur par endpoint
  - Utilisation des ressources
  - Statut des services externes

## Problèmes d'Authentification

### Erreur "Invalid JWT Token"

**Diagnostic :**
```sql
-- Vérifier l'utilisateur
SELECT id, email, role, created_at, updated_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Vérifier le profil
SELECT * FROM profiles WHERE id = 'user-uuid';
```

**Solutions :**
1. Régénérer le token JWT
2. Vérifier la configuration NextAuth
3. Synchroniser les données auth.users et profiles

### Problème de Rôles et Permissions

**Diagnostic :**
```sql
-- Vérifier les rôles
SELECT p.id, p.role, p.full_name, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'user@example.com';

-- Vérifier les permissions
SELECT * FROM user_permissions WHERE user_id = 'user-uuid';
```

**Solutions :**
1. Corriger le rôle dans la table profiles
2. Vérifier la configuration ROLE_PERMISSIONS
3. Forcer la reconnexion de l'utilisateur

### Échec de Vérification Partenaire

**Diagnostic :**
```sql
-- Statut de vérification
SELECT pp.*, p.full_name, p.email
FROM partner_profiles pp
JOIN profiles p ON pp.user_id = p.id
WHERE pp.verification_status = 'pending'
ORDER BY pp.created_at DESC;
```

**Actions :**
1. Examiner les documents soumis
2. Vérifier les critères de validation
3. Contacter le partenaire si documents manquants

## Erreurs de Base de Données

### Erreur de Connexion

**Diagnostic :**
```bash
# Tester la connexion
psql $DATABASE_URL -c "SELECT version();"

# Vérifier les connexions actives
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions :**
1. Redémarrer le pool de connexions
2. Vérifier les limites de connexion
3. Optimiser les requêtes longues

### Violation de Contrainte

**Diagnostic :**
```sql
-- Identifier les contraintes violées
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass;

-- Vérifier l'intégrité des données
SELECT * FROM bookings 
WHERE loft_id NOT IN (SELECT id FROM lofts);
```

**Solutions :**
1. Corriger les données incohérentes
2. Ajouter les validations manquantes
3. Mettre à jour les contraintes si nécessaire

### Problème de Performance

**Diagnostic :**
```sql
-- Requêtes lentes
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index manquants
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

**Solutions :**
1. Ajouter des index appropriés
2. Optimiser les requêtes complexes
3. Mettre en place du cache

## Problèmes de Performance

### Temps de Réponse Élevé

**Diagnostic :**
```bash
# Profiling des requêtes
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/api/lofts/search

# Monitoring des ressources
top -p $(pgrep -f "node.*next")
```

**Solutions :**
1. Optimiser les requêtes de recherche
2. Implémenter la pagination
3. Ajouter du cache Redis

### Surcharge de la Base de Données

**Diagnostic :**
```sql
-- Connexions actives
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Requêtes bloquantes
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions :**
1. Terminer les requêtes bloquantes
2. Optimiser les transactions longues
3. Augmenter les ressources si nécessaire

## Erreurs de Paiement

### Échec de Transaction Stripe

**Diagnostic :**
```javascript
// Vérifier dans Stripe Dashboard
// Ou via API
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const payment = await stripe.paymentIntents.retrieve('pi_xxx');
console.log(payment.last_payment_error);
```

**Solutions :**
1. Vérifier la configuration Stripe
2. Contrôler les webhooks
3. Synchroniser les statuts de paiement

### Problème de Remboursement

**Diagnostic :**
```sql
-- Vérifier les transactions
SELECT b.id, b.total_price, b.payment_status, b.status
FROM bookings b
WHERE b.id = 'booking-uuid';

-- Historique des paiements
SELECT * FROM payment_logs 
WHERE booking_id = 'booking-uuid'
ORDER BY created_at DESC;
```

**Solutions :**
1. Traiter le remboursement manuellement
2. Mettre à jour le statut de réservation
3. Notifier les parties concernées

## Problèmes de Notifications

### Emails Non Envoyés

**Diagnostic :**
```bash
# Vérifier les logs d'email
grep "email" /var/log/app.log | tail -20

# Tester l'API email
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@yourapp.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

**Solutions :**
1. Vérifier la configuration du service email
2. Contrôler les quotas et limites
3. Valider les templates d'email

### Notifications Push Non Reçues

**Diagnostic :**
```sql
-- Vérifier les notifications
SELECT * FROM notifications 
WHERE user_id = 'user-uuid' 
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Statut de lecture
SELECT status, count(*) 
FROM notifications 
WHERE user_id = 'user-uuid'
GROUP BY status;
```

**Solutions :**
1. Vérifier la connexion WebSocket
2. Contrôler les permissions de notification
3. Redémarrer le service de notifications

## Escalade et Procédures

### Niveaux d'Escalade

1. **Niveau 1** : Support technique standard
   - Problèmes courants
   - Solutions documentées
   - Temps de résolution : < 2h

2. **Niveau 2** : Support technique avancé
   - Problèmes complexes
   - Analyse approfondie requise
   - Temps de résolution : < 24h

3. **Niveau 3** : Équipe de développement
   - Bugs critiques
   - Modifications de code nécessaires
   - Temps de résolution : < 72h

### Critères d'Escalade

**Escalade immédiate :**
- Panne générale de la plateforme
- Faille de sécurité détectée
- Perte de données
- Problème de paiement massif

**Escalade programmée :**
- Problème récurrent non résolu
- Demande de nouvelle fonctionnalité
- Optimisation de performance
- Formation équipe support

### Procédure d'Incident Critique

1. **Détection** (0-5 min)
   - Alerte automatique ou signalement
   - Classification de la criticité
   - Notification de l'équipe d'astreinte

2. **Évaluation** (5-15 min)
   - Diagnostic initial
   - Évaluation de l'impact
   - Décision d'escalade

3. **Communication** (15-30 min)
   - Notification des utilisateurs si nécessaire
   - Information des parties prenantes
   - Mise à jour du statut

4. **Résolution** (Variable)
   - Application de la solution
   - Tests de validation
   - Monitoring post-résolution

5. **Post-mortem** (24-48h après)
   - Analyse des causes
   - Plan d'amélioration
   - Mise à jour de la documentation

### Contacts d'Urgence

- **Équipe technique** : +33 6 XX XX XX XX
- **Responsable sécurité** : +33 6 XX XX XX XX
- **CTO** : +33 6 XX XX XX XX
- **Astreinte Stripe** : Via dashboard Stripe

### Templates de Communication

#### Email d'Incident
```
Objet: [INCIDENT] Problème technique sur la plateforme

Cher utilisateur,

Nous rencontrons actuellement un problème technique qui peut affecter [fonctionnalité].

Statut: En cours de résolution
Impact: [Description]
ETA: [Estimation]

Nous vous tiendrons informés de l'évolution.

L'équipe technique
```

#### Résolution d'Incident
```
Objet: [RÉSOLU] Problème technique résolu

Le problème technique signalé à [heure] a été résolu.

Cause: [Explication]
Solution: [Actions prises]
Prévention: [Mesures mises en place]

Merci de votre patience.
```

---

**Documentation mise à jour** : [Date] | **Version** : 1.0