# 🚀 Démarrage Rapide - Notifications Airbnb

## En 5 Minutes ⏱️

Suivez ces étapes pour activer les notifications Airbnb dans votre application.

---

## ✅ Étape 1 : Appliquer la Migration SQL (2 min)

1. Ouvrir **Supabase Dashboard** → SQL Editor
2. Copier le contenu de `supabase/migrations/20260601000000_create_airbnb_notifications.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **Run**
5. Vérifier qu'il n'y a pas d'erreur

**Vérification :**
```sql
SELECT COUNT(*) FROM airbnb_notifications;
-- Devrait retourner 0 (table vide mais créée)
```

---

## ✅ Étape 2 : Intégrer le Composant (2 min)

### Trouver votre fichier navbar

Cherchez un de ces fichiers :
- `components/layout/navbar.tsx`
- `components/navbar.tsx`
- `app/components/navbar.tsx`

### Ajouter le composant

```typescript
// 1. Ajouter l'import en haut du fichier
import { AirbnbNotificationsBell } from '@/components/admin/airbnb-notifications-bell';

// 2. Dans votre composant Navbar, ajouter :
export function Navbar() {
  const { user } = useAuth(); // Ou votre méthode pour récupérer l'utilisateur
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Votre contenu existant */}
        
        <div className="flex items-center gap-3">
          {/* AJOUTER ICI ⬇️ */}
          {isAdmin && <AirbnbNotificationsBell />}
          
          {/* Vos autres boutons (user menu, etc.) */}
        </div>
      </div>
    </nav>
  );
}
```

---

## ✅ Étape 3 : Tester (1 min)

### Créer une notification de test

Dans Supabase SQL Editor :

```sql
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
  '🎉 TEST - Nouvelle réservation - ' || l.name,
  r.guest_name || ' • Test notification',
  '{"test": true}'::jsonb
FROM reservations r
JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
LIMIT 1;
```

### Vérifier dans l'application

1. Rafraîchir la page
2. Vous devriez voir un badge rouge "1" sur la cloche
3. Cliquer sur la cloche → La notification apparaît
4. Cliquer sur la notification → Elle est marquée comme lue

---

## ✅ C'est Tout ! 🎉

Votre système de notifications est maintenant **opérationnel**.

---

## 🔍 Vérifications

### ✅ Checklist Rapide

- [ ] Migration SQL appliquée sans erreur
- [ ] Composant ajouté dans la navbar
- [ ] Badge rouge visible (si notifications non lues)
- [ ] Clic sur la cloche ouvre le panel
- [ ] Notifications s'affichent correctement
- [ ] Marquage comme lu fonctionne

### ❌ Problèmes Courants

#### Le composant ne s'affiche pas

**Solution :**
- Vérifier que `isAdmin` est `true`
- Vérifier l'import du composant
- Vérifier la console pour les erreurs

#### Le badge ne s'affiche pas

**Solution :**
- Vérifier que la migration SQL est appliquée
- Vérifier qu'il y a des notifications non lues dans la DB
- Vérifier l'API : `GET /api/airbnb/notifications?unread=true`

#### Erreur 403 (Forbidden)

**Solution :**
- Vérifier que l'utilisateur connecté a le rôle `admin`
- Vérifier les politiques RLS dans Supabase

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

1. **GUIDE_NOTIFICATIONS_AIRBNB.md** - Guide complet
2. **INTEGRATION_NAVBAR_NOTIFICATIONS.md** - Guide d'intégration
3. **RESUME_IMPLEMENTATION_NOTIFICATIONS.md** - Résumé technique

---

## 🧪 Test Complet (Optionnel)

Pour tester toutes les fonctionnalités :

```bash
# Dans Supabase SQL Editor
# Exécuter le fichier : scripts/test-airbnb-notifications.sql
```

Ce script teste :
- ✅ Création de la table
- ✅ Indexes
- ✅ Politiques RLS
- ✅ Création de notifications
- ✅ Marquage comme lu
- ✅ Fonction de nettoyage

---

## 🚀 Utilisation avec le Scraper Python

Une fois le système activé, les notifications seront créées automatiquement quand :

1. Le scraper Python envoie de nouvelles réservations
2. Une réservation est modifiée
3. Une réservation est annulée

**Aucune configuration supplémentaire nécessaire !**

---

## 🎯 Prochaines Actions

### Immédiat
- [x] Migration SQL appliquée
- [x] Composant intégré
- [x] Tests réussis

### Court Terme (Optionnel)
- [ ] Personnaliser l'intervalle de polling (défaut: 30s)
- [ ] Ajuster le nombre de notifications affichées (défaut: 20)
- [ ] Créer le dashboard complet `/admin/airbnb/notifications`

### Moyen Terme (Optionnel)
- [ ] Ajouter les notifications email
- [ ] Ajouter le résumé quotidien
- [ ] Passer à WebSocket pour le temps réel

---

## 💡 Astuces

### Voir toutes les notifications dans la DB

```sql
SELECT 
  n.*,
  l.name as loft_name,
  r.guest_name
FROM airbnb_notifications n
LEFT JOIN lofts l ON l.id = n.loft_id
LEFT JOIN reservations r ON r.id = n.reservation_id
ORDER BY n.created_at DESC
LIMIT 20;
```

### Compter les notifications non lues

```sql
SELECT COUNT(*) as unread_count
FROM airbnb_notifications
WHERE is_read = FALSE;
```

### Marquer toutes comme lues

```sql
UPDATE airbnb_notifications
SET is_read = TRUE, read_at = NOW()
WHERE is_read = FALSE;
```

### Supprimer les notifications de test

```sql
DELETE FROM airbnb_notifications
WHERE metadata->>'test' = 'true';
```

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. **Vérifier les logs** : Console du navigateur (F12)
2. **Vérifier l'API** : Onglet Network → `/api/airbnb/notifications`
3. **Vérifier la DB** : Supabase → Table Editor → `airbnb_notifications`
4. **Consulter la doc** : `GUIDE_NOTIFICATIONS_AIRBNB.md`

---

## ✅ Résumé

**Temps total :** 5 minutes  
**Étapes :** 3  
**Difficulté :** Facile  
**Résultat :** Notifications Airbnb opérationnelles ✅

---

**Félicitations ! 🎉**

Votre système de notifications Airbnb est maintenant actif. Les admins seront notifiés en temps réel des nouvelles réservations, modifications et annulations.

---

**Date :** 2026-06-01  
**Version :** 1.0.0  
**Statut :** Production Ready
