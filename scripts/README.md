# 📁 Scripts - Tracking des Visiteurs

## 📄 test-visitor-tracking.sql

Script de test complet pour le système de tracking des visiteurs.

### 🎯 Objectif

Tester et valider le système de tracking en créant des données de démonstration réalistes.

### 📊 Ce Que Fait le Script

1. **Vérification du Système**
   - Vérifie que les tables existent
   - Vérifie que les fonctions SQL existent
   - Vérifie que les index sont en place

2. **État Actuel**
   - Affiche les statistiques actuelles
   - Liste les derniers visiteurs
   - Montre l'état de la base de données

3. **Création de Données de Test**
   - Crée 20 visiteurs de test
   - Données réalistes et variées :
     - 60% mobile, 30% desktop, 10% tablet
     - Différents navigateurs (Chrome, Firefox, Safari, Edge)
     - Différentes sources (Google, Facebook, Instagram, Direct)
     - Différentes pages d'arrivée (/fr, /en, /ar, /fr/lofts)
   - Ajoute des pages vues pour 50% des visiteurs

4. **Vérification Après Création**
   - Affiche les nouvelles statistiques
   - Montre la répartition par appareil
   - Montre la répartition par navigateur
   - Affiche les sources de trafic
   - Liste les pages d'arrivée populaires
   - Montre les tendances des 7 derniers jours

### 🚀 Comment Utiliser

#### Méthode 1 : Supabase Dashboard (Recommandé)

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet

2. **Ouvrez SQL Editor**
   - Cliquez sur "SQL Editor" dans le menu
   - Cliquez sur "New query"

3. **Copiez le Script**
   - Ouvrez `scripts/test-visitor-tracking.sql`
   - Copiez TOUT le contenu (Ctrl+A, Ctrl+C)

4. **Exécutez**
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run" (ou F5)
   - Attendez ~5 secondes

5. **Vérifiez les Résultats**
   - Vous verrez plusieurs tableaux de résultats
   - Vérifiez que tout est ✅ OK

#### Méthode 2 : Ligne de Commande

```bash
# Si vous avez psql installé
psql -h your-supabase-host -U postgres -d postgres -f scripts/test-visitor-tracking.sql
```

### 📊 Résultats Attendus

Après l'exécution, vous devriez voir :

```
✅ Tables: 2 (visitors, page_views)
✅ Functions: 3 (get_visitor_stats, get_visitor_trends, record_visitor)
✅ Indexes: 7+

📊 STATISTIQUES ACTUELLES
Total Visiteurs: 20
Visiteurs Aujourd'hui: 20
Nouveaux Aujourd'hui: 20
Total Pages Vues: 10
Pages Vues Aujourd'hui: 10
Durée Moy.: ~150 secondes

📱 RÉPARTITION PAR APPAREIL
mobile: 12 (60%)
desktop: 6 (30%)
tablet: 2 (10%)

🌐 RÉPARTITION PAR NAVIGATEUR
Chrome: 5 (25%)
Safari: 5 (25%)
Firefox: 5 (25%)
Edge: 5 (25%)
```

### 🧹 Nettoyage

Pour supprimer les données de test :

```sql
-- Supprimer uniquement les données de test
DELETE FROM page_views WHERE session_id LIKE 'demo-session-%';
DELETE FROM visitors WHERE session_id LIKE 'demo-session-%';
```

Pour supprimer TOUTES les données (⚠️ ATTENTION) :

```sql
-- ATTENTION : Ceci supprime TOUT !
DELETE FROM page_views;
DELETE FROM visitors;
```

### 🔍 Requêtes Utiles

Le script inclut aussi des requêtes commentées pour :

```sql
-- Voir les détails d'un visiteur
SELECT * FROM visitors WHERE session_id = 'votre-session-id';

-- Voir toutes les pages vues d'un visiteur
SELECT * FROM page_views WHERE session_id = 'votre-session-id';

-- Statistiques en temps réel
SELECT * FROM get_visitor_stats();

-- Tendances des 7 derniers jours
SELECT * FROM get_visitor_trends();
```

### 🆘 Dépannage

#### Erreur : "function record_visitor does not exist"

**Cause :** Le schéma SQL n'est pas déployé

**Solution :**
1. Ouvrez `database/visitor-tracking-schema.sql`
2. Exécutez-le dans Supabase SQL Editor
3. Réessayez le script de test

#### Erreur : "relation visitors does not exist"

**Cause :** Les tables n'existent pas

**Solution :**
1. Exécutez d'abord `database/visitor-tracking-schema.sql`
2. Puis exécutez ce script de test

#### Erreur : "permission denied"

**Cause :** Problème de permissions

**Solution :**
1. Vérifiez que vous êtes connecté avec le bon compte
2. Vérifiez les politiques RLS
3. Utilisez le service role key si nécessaire

### 📚 Documentation

- **Guide complet :** `TRACKING_VISITEURS_LIGHT.md`
- **Démarrage rapide :** `DEMARRAGE_RAPIDE_TRACKING.md`
- **Implémentation :** `TRACKING_IMPLEMENTATION_COMPLETE.md`
- **Schéma SQL :** `database/visitor-tracking-schema.sql`

### ✅ Checklist

Avant d'exécuter le script :
- [ ] Le schéma SQL est déployé (`visitor-tracking-schema.sql`)
- [ ] Vous êtes connecté à Supabase
- [ ] Vous avez les permissions nécessaires

Après l'exécution :
- [ ] Vérifiez les résultats dans le terminal
- [ ] Consultez le dashboard superuser
- [ ] Testez les requêtes manuellement

---

**Prêt à tester ? Exécutez le script maintenant ! 🚀**
