# 🔔 Guide des Notifications Airbnb

## Vue d'ensemble

Le système de notifications Airbnb permet aux administrateurs de recevoir des alertes en temps réel lorsque le scraper Python envoie de nouvelles réservations, des modifications ou des annulations.

---

## 🎯 Fonctionnalités

### 1. Notifications In-App

**Icône de cloche dans la navbar** (visible uniquement pour les admins)
- Badge rouge avec le nombre de notifications non lues
- Clic sur la cloche → Panel déroulant avec les dernières notifications
- Mise à jour automatique toutes les 30 secondes

### 2. Types de Notifications

| Type | Icône | Description |
|------|-------|-------------|
| **new** | 🎉 | Nouvelle réservation créée |
| **updated** | 📝 | Réservation modifiée |
| **cancelled** | ❌ | Réservation annulée |
| **conflict** | ⚠️ | Conflit de dates détecté |
| **error** | 🚨 | Erreur de synchronisation |

### 3. Informations Affichées

Chaque notification contient :
- **Titre** : Type d'événement + nom du loft
- **Message** : Nom du guest, dates, nombre de nuits, montant
- **Temps écoulé** : "Il y a 5 minutes", "Il y a 2 heures", etc.
- **Badge "Nouveau"** : Pour les notifications non lues
- **Point bleu** : Indicateur visuel de non-lu

---

## 🚀 Utilisation

### Pour les Administrateurs

#### 1. Voir les Notifications

1. Connectez-vous en tant qu'admin
2. Regardez l'icône de cloche dans la navbar (en haut à droite)
3. Si un badge rouge apparaît, vous avez de nouvelles notifications
4. Cliquez sur la cloche pour voir les détails

#### 2. Marquer comme Lu

**Option A : Individuellement**
- Cliquez sur une notification dans le panel
- Elle sera automatiquement marquée comme lue
- Le point bleu disparaît

**Option B : Toutes en même temps**
- Cliquez sur "Tout marquer" dans le header du panel
- Toutes les notifications non lues seront marquées

#### 3. Accéder au Dashboard Complet

- Cliquez sur "Voir toutes les notifications" en bas du panel
- Vous serez redirigé vers `/admin/airbnb/notifications`
- (Page à créer dans une prochaine étape)

---

## 🔧 Configuration Technique

### 1. Migration de Base de Données

La table `airbnb_notifications` a été créée avec :

```sql
CREATE TABLE airbnb_notifications (
  id UUID PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  loft_id UUID REFERENCES lofts(id),
  type VARCHAR(50), -- 'new', 'updated', 'cancelled', 'conflict', 'error'
  title VARCHAR(255),
  message TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  read_at TIMESTAMP,
  read_by UUID REFERENCES users(id)
);
```

**Appliquer la migration :**
```bash
# Dans Supabase SQL Editor
# Exécuter le fichier : supabase/migrations/20260601000000_create_airbnb_notifications.sql
```

### 2. API Endpoints

#### GET /api/airbnb/notifications
Récupère les notifications pour l'admin connecté

**Query params :**
- `unread=true` : Filtrer uniquement les non lues
- `limit=50` : Nombre de notifications (défaut: 50)

**Réponse :**
```json
{
  "success": true,
  "notifications": [...],
  "unreadCount": 5,
  "total": 20
}
```

#### POST /api/airbnb/notifications/[id]/read
Marque une notification comme lue

**Réponse :**
```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

#### POST /api/airbnb/notifications/read-all
Marque toutes les notifications comme lues

**Réponse :**
```json
{
  "success": true,
  "message": "Toutes les notifications ont été marquées comme lues"
}
```

### 3. Intégration dans le Scraper Python

Les notifications sont créées automatiquement par le service de synchronisation :

**Quand une nouvelle réservation est créée :**
```typescript
await createAirbnbNotification({
  reservationId: reservation.id,
  loftId: reservation.loft_id,
  type: 'new',
  metadata: { sync_batch_id, sync_type }
});
```

**Quand une réservation est mise à jour :**
```typescript
await createAirbnbNotification({
  reservationId: reservation.id,
  loftId: reservation.loft_id,
  type: 'updated', // ou 'cancelled' si status === 'cancelled'
  metadata: { sync_batch_id, sync_type }
});
```

---

## 📊 Fonctionnement Technique

### Flux de Données

```
┌─────────────────────────────────────┐
│  Scraper Python                     │
│  (D:\Airbnb_transfer_v2\)           │
└──────────────┬──────────────────────┘
               │
               ↓ POST /api/airbnb/sync
┌─────────────────────────────────────┐
│  API Next.js                        │
│  - Valide les données               │
│  - Crée/met à jour les réservations │
│  - Crée les notifications           │
└──────────────┬──────────────────────┘
               │
               ↓ INSERT INTO airbnb_notifications
┌─────────────────────────────────────┐
│  Base de Données Supabase           │
│  - Table: airbnb_notifications      │
└──────────────┬──────────────────────┘
               │
               ↓ Polling (30s)
┌─────────────────────────────────────┐
│  Frontend Next.js                   │
│  - Composant: AirbnbNotificationsBell│
│  - Affiche le badge + panel         │
│  - Toast pour nouvelles notifs      │
└─────────────────────────────────────┘
```

### Polling vs WebSocket

**Actuellement : Polling (30 secondes)**
- ✅ Simple à implémenter
- ✅ Fonctionne avec Vercel
- ✅ Pas de serveur WebSocket nécessaire
- ⚠️ Délai de 30 secondes maximum

**Future : WebSocket (optionnel)**
- ✅ Notifications instantanées
- ✅ Moins de requêtes HTTP
- ❌ Plus complexe
- ❌ Nécessite un serveur WebSocket (Pusher, Ably, etc.)

---

## 🎨 Personnalisation

### Modifier l'Intervalle de Polling

**Fichier :** `components/admin/airbnb-notifications-bell.tsx`

```typescript
// Ligne 88 : Changer 30000 (30 secondes) par la valeur souhaitée
const interval = setInterval(fetchNotifications, 30000);

// Exemples :
// 10 secondes : 10000
// 1 minute : 60000
// 5 minutes : 300000
```

### Modifier le Nombre de Notifications Affichées

**Fichier :** `components/admin/airbnb-notifications-bell.tsx`

```typescript
// Ligne 82 : Changer limit=20
const res = await fetch('/api/airbnb/notifications?unread=true&limit=20');

// Exemples :
// 10 notifications : limit=10
// 50 notifications : limit=50
// 100 notifications : limit=100
```

### Modifier les Couleurs par Type

**Fichier :** `components/admin/airbnb-notifications-bell.tsx`

```typescript
// Ligne 145 : Fonction getTypeColor
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'new':
      return 'bg-green-50 border-green-200'; // Vert pour nouveau
    case 'updated':
      return 'bg-blue-50 border-blue-200'; // Bleu pour modifié
    // ... etc
  }
};
```

---

## 🧪 Tests

### Tester les Notifications

#### 1. Créer une Notification Manuellement

```sql
-- Dans Supabase SQL Editor
INSERT INTO airbnb_notifications (
  reservation_id,
  loft_id,
  type,
  title,
  message,
  metadata
)
SELECT 
  r.id,
  r.loft_id,
  'new',
  'Test - Nouvelle réservation',
  'Test Guest • 15 juin 2026 → 20 juin 2026 (5 nuits) • 25,000 DZD',
  '{"test": true}'::jsonb
FROM reservations r
WHERE r.source = 'airbnb_scraper'
LIMIT 1;
```

#### 2. Vérifier l'Affichage

1. Rafraîchir la page admin
2. Regarder l'icône de cloche
3. Le badge rouge devrait afficher "1"
4. Cliquer sur la cloche pour voir la notification

#### 3. Tester le Marquage comme Lu

1. Cliquer sur la notification
2. Le point bleu devrait disparaître
3. Le badge devrait passer à "0"

---

## 📈 Métriques et Monitoring

### Requêtes Utiles

#### Compter les Notifications Non Lues

```sql
SELECT COUNT(*) as unread_count
FROM airbnb_notifications
WHERE is_read = FALSE;
```

#### Notifications par Type (7 derniers jours)

```sql
SELECT 
  type,
  COUNT(*) as count
FROM airbnb_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;
```

#### Temps Moyen de Lecture

```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) / 60 as avg_minutes
FROM airbnb_notifications
WHERE is_read = TRUE
AND read_at IS NOT NULL;
```

#### Notifications Non Lues par Admin

```sql
SELECT 
  u.email,
  COUNT(*) as unread_count
FROM airbnb_notifications n
LEFT JOIN users u ON u.role = 'admin'
WHERE n.is_read = FALSE
GROUP BY u.email;
```

---

## 🔒 Sécurité

### Row Level Security (RLS)

Les politiques RLS garantissent que :
- ✅ Seuls les admins peuvent voir les notifications
- ✅ Seuls les admins peuvent marquer comme lu
- ✅ Le système peut créer des notifications

**Politiques appliquées :**

```sql
-- Lecture : Admins uniquement
CREATE POLICY "Admins can view all notifications"
ON airbnb_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Mise à jour : Admins uniquement
CREATE POLICY "Admins can update notifications"
ON airbnb_notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## 🧹 Maintenance

### Nettoyer les Anciennes Notifications

Les notifications lues de plus de 90 jours sont automatiquement supprimées.

**Fonction SQL :**
```sql
SELECT cleanup_old_airbnb_notifications();
```

**Planifier avec pg_cron (optionnel) :**
```sql
-- Exécuter tous les jours à 3h du matin
SELECT cron.schedule(
  'cleanup-old-airbnb-notifications',
  '0 3 * * *',
  'SELECT cleanup_old_airbnb_notifications()'
);
```

---

## 🚀 Prochaines Étapes (Optionnel)

### Phase 2 : Notifications Email

- [ ] Configurer Resend API
- [ ] Créer les templates email
- [ ] Envoyer un email pour chaque nouvelle réservation
- [ ] Envoyer un résumé quotidien

### Phase 3 : Dashboard de Monitoring

- [ ] Créer la page `/admin/airbnb/notifications`
- [ ] Afficher toutes les notifications (avec pagination)
- [ ] Filtres par type, date, loft
- [ ] Graphiques et statistiques

### Phase 4 : WebSocket (Temps Réel)

- [ ] Configurer Pusher ou Ably
- [ ] Remplacer le polling par WebSocket
- [ ] Notifications instantanées

---

## ❓ FAQ

### Q : Les notifications fonctionnent-elles en production ?
**R :** Oui, une fois la migration appliquée dans Supabase production.

### Q : Combien de temps les notifications sont-elles conservées ?
**R :** Les notifications lues sont conservées 90 jours, les non lues indéfiniment.

### Q : Puis-je désactiver les notifications ?
**R :** Oui, commentez l'appel à `createAirbnbNotification()` dans le service de synchronisation.

### Q : Les notifications ralentissent-elles la synchronisation ?
**R :** Non, la création de notifications est asynchrone et ne bloque pas la synchronisation.

### Q : Puis-je recevoir des notifications par email ?
**R :** Pas encore, mais c'est prévu dans la Phase 2 (voir "Prochaines Étapes").

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs dans la console du navigateur
2. Vérifier les logs de l'API Next.js
3. Vérifier la table `airbnb_notifications` dans Supabase

---

**Date de création :** 2026-06-01  
**Version :** 1.0.0  
**Auteur :** Système de Notifications Airbnb
