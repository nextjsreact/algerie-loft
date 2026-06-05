# 🔔 Test des Notifications Airbnb

Ce document explique comment tester le système de notifications Airbnb.

## 📋 Méthodes de Test Disponibles

### 1. Via l'Interface Web (Recommandé) ⭐

**Fichier:** `test-airbnb-notification.html`

**Utilisation:**
1. Ouvrez le fichier dans votre navigateur : `http://localhost:3000/test-airbnb-notification.html`
2. Assurez-vous d'être connecté en tant qu'admin
3. Cliquez sur "Créer une notification de test"
4. Vérifiez la cloche de notification dans l'interface

**Avantages:**
- Interface visuelle simple
- Affiche tous les détails de la notification créée
- Pas besoin de ligne de commande

---

### 2. Via l'API REST

**Endpoint:** `GET /api/airbnb/notifications/test`

**Utilisation dans la console du navigateur:**
```javascript
fetch('/api/airbnb/notifications/test')
  .then(res => res.json())
  .then(data => console.log(data))
```

**Utilisation avec curl:**
```bash
curl http://localhost:3000/api/airbnb/notifications/test
```

**Avantages:**
- Rapide et direct
- Peut être intégré dans des scripts de test
- Retourne un JSON détaillé

---

### 3. Via Script Node.js

**Fichier:** `scripts/test-airbnb-notification.js`

**Utilisation:**
```bash
node scripts/test-airbnb-notification.js
```

**Prérequis:**
- Variables d'environnement configurées dans `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Avantages:**
- Fonctionne indépendamment du serveur Next.js
- Accès direct à Supabase
- Utile pour les tests automatisés

---

### 4. Via SQL Direct

**Fichier:** `test-airbnb-notification.sql`

**Utilisation:**
1. Ouvrez l'éditeur SQL dans Supabase Dashboard
2. Copiez-collez le contenu du fichier
3. Exécutez la requête

**Avantages:**
- Contrôle total sur les données
- Utile pour tester des cas spécifiques
- Pas de dépendances

---

## 🎯 Que Teste Chaque Méthode ?

Toutes les méthodes créent une notification avec :

- **Type:** `new` (nouvelle réservation)
- **Titre:** `🎉 Nouvelle réservation - [Nom du Loft]`
- **Message:** `[Invité] • [Date début] → [Date fin] ([X] nuits) • [Prix] DA`
- **Métadonnées:**
  - Nom de l'invité (aléatoire)
  - Dates de check-in/check-out (futures)
  - Prix total et par nuit
  - Nombre de nuits
  - Statut de la réservation
  - Flag `test: true` pour identifier les notifications de test

---

## ✅ Vérifications à Effectuer

Après avoir créé une notification de test :

### 1. Badge de Notification
- [ ] Le badge sur la cloche affiche le bon nombre
- [ ] Le badge sur le menu "Notifications" dans la sidebar affiche le bon nombre

### 2. Liste des Notifications
- [ ] La notification apparaît dans la section "🏠 Airbnb"
- [ ] Le titre et le message sont correctement affichés
- [ ] L'icône et les couleurs sont appropriées
- [ ] La date relative est correcte (ex: "à l'instant")

### 3. Marquer comme Lu
- [ ] Cliquer sur la notification la marque comme lue
- [ ] La notification disparaît de la liste
- [ ] Le badge se met à jour (décrémente de 1)
- [ ] Pas d'erreurs dans la console

### 4. Traductions
- [ ] Aucune erreur `MISSING_MESSAGE` dans la console
- [ ] Les anciennes notifications s'affichent correctement
- [ ] Les nouvelles notifications utilisent le bon format

---

## 🐛 Dépannage

### Erreur 401 (Non authentifié)
- Assurez-vous d'être connecté
- Vérifiez que votre session est valide

### Erreur 403 (Accès refusé)
- Seuls les admins peuvent créer des notifications de test
- Vérifiez votre rôle dans la table `profiles`

### Erreur 404 (Aucun loft trouvé)
- Assurez-vous qu'il y a au moins un loft dans la base de données
- Vérifiez la table `lofts`

### La notification n'apparaît pas
- Vérifiez la console pour les erreurs
- Actualisez la page
- Vérifiez que le polling est actif (toutes les 30 secondes)
- Ouvrez/fermez la cloche de notification

### Erreurs de traduction
- Vérifiez que le serveur Next.js a été redémarré après les modifications de `next-intl.config.ts`
- Vérifiez la console pour les warnings de traduction
- Assurez-vous que `nextIntlConfig` est bien importé dans `client-providers-nextintl.tsx`

---

## 📊 Données de Test Générées

Les notifications de test utilisent des données aléatoires :

- **Invités possibles:** Jean Dupont, Marie Martin, Ahmed Benali, Sophie Laurent, Karim Meziane
- **Dates:** Entre aujourd'hui et +30 jours
- **Durée:** Entre 2 et 7 nuits
- **Prix:** Entre 12 000 et 20 000 DA par nuit

---

## 🧹 Nettoyage

Pour supprimer toutes les notifications de test :

```sql
DELETE FROM airbnb_notifications 
WHERE metadata->>'test' = 'true';
```

Ou via l'API (à créer si nécessaire) :

```javascript
// À implémenter si besoin
fetch('/api/airbnb/notifications/test', { method: 'DELETE' })
```

---

## 📝 Notes

- Les notifications de test ont `metadata.test = true` pour les identifier
- Elles sont créées avec `is_read = false` par défaut
- Elles utilisent un `reservation_id` UUID aléatoire (pas de vraie réservation)
- Le système de polling les détecte automatiquement toutes les 30 secondes

---

## 🚀 Prochaines Étapes

Après avoir vérifié que tout fonctionne :

1. Tester avec de vraies synchronisations Airbnb
2. Vérifier les notifications de type `updated`, `cancelled`, `conflict`, `error`
3. Tester sur mobile (responsive)
4. Tester les notifications en temps réel (si WebSocket activé)
5. Tester avec plusieurs utilisateurs simultanément

---

**Dernière mise à jour:** 1er juin 2026
