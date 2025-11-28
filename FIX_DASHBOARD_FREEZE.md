# 🔧 FIX : Dashboard Superuser Figé

## ❌ Problème

Le dashboard superuser se fige et les statistiques de visiteurs ne s'affichent pas.

## 🔍 Cause

La fonction SQL `get_visitor_stats()` n'existe pas ou retourne une erreur, ce qui bloque le chargement du composant `VisitorStatsCard`.

## ✅ Solution Immédiate

### Étape 1 : Vérifier si la fonction existe

Exécutez dans Supabase SQL Editor :

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_visitor_stats';
```

**Si aucun résultat :** La fonction n'existe pas → Passez à l'Étape 2

### Étape 2 : Créer la fonction manquante

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Créer la fonction get_visitor_stats
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS TABLE (
    total_visitors BIGINT,
    today_visitors BIGINT,
    unique_today BIGINT,
    total_page_views BIGINT,
    today_page_views BIGINT,
    avg_session_duration NUMERIC
) AS $$
BEGIN
    -- Vérifier si la table visitors existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visitors') THEN
        -- Retourner des zéros si la table n'existe pas
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        -- Total unique visitors (all time)
        COALESCE(COUNT(DISTINCT v.id), 0)::BIGINT as total_visitors,
        
        -- Total visitors today (including returning)
        COALESCE(COUNT(DISTINCT CASE 
            WHEN v.last_visit::date = CURRENT_DATE 
            THEN v.id 
        END), 0)::BIGINT as today_visitors,
        
        -- New unique visitors today
        COALESCE(COUNT(DISTINCT CASE 
            WHEN v.first_visit::date = CURRENT_DATE 
            THEN v.id 
        END), 0)::BIGINT as unique_today,
        
        -- Total page views (all time)
        COALESCE((SELECT COUNT(*)::BIGINT FROM page_views), 0) as total_page_views,
        
        -- Page views today
        COALESCE((SELECT COUNT(*)::BIGINT FROM page_views 
         WHERE viewed_at::date = CURRENT_DATE), 0) as today_page_views,
        
        -- Average session duration in seconds
        COALESCE(
            (SELECT AVG(duration_seconds)::NUMERIC 
             FROM page_views 
             WHERE duration_seconds IS NOT NULL),
            0
        ) as avg_session_duration
    FROM visitors v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_visitor_stats() TO authenticated;
```

### Étape 3 : Tester la fonction

```sql
SELECT * FROM get_visitor_stats();
```

**Résultat attendu :**
```
total_visitors | today_visitors | unique_today | total_page_views | today_page_views | avg_session_duration
24             | 24             | 24           | 10               | 10               | 170.5
```

### Étape 4 : Rafraîchir le Dashboard

1. Retournez sur le dashboard superuser
2. Rafraîchissez la page (F5)
3. Les statistiques devraient maintenant s'afficher

---

## 🔧 Solution Alternative : Désactiver Temporairement

Si vous voulez juste débloquer le dashboard sans les stats de visiteurs :

### Modifier le Composant

**Fichier :** `components/admin/superuser/superuser-dashboard.tsx`

Commentez temporairement la ligne qui affiche les stats :

```typescript
// Commentez cette ligne
// <VisitorStatsCard />
```

Cela permettra au dashboard de charger sans les statistiques de visiteurs.

---

## 🔍 Diagnostic Complet

### Vérifier les Tables

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('visitors', 'page_views');
```

**Attendu :** 2 lignes

### Vérifier les Fonctions

```sql
-- Vérifier que les fonctions existent
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_visitor_stats', 'get_visitor_trends', 'record_visitor');
```

**Attendu :** 3 lignes

### Vérifier les Données

```sql
-- Vérifier qu'il y a des données
SELECT COUNT(*) FROM visitors;
SELECT COUNT(*) FROM page_views;
```

---

## 🆘 Si Ça Ne Marche Toujours Pas

### Option 1 : Recréer Tout le Schéma

Exécutez le schéma complet :

```bash
# Ouvrez database/visitor-tracking-schema.sql
# Copiez TOUT le contenu
# Collez dans Supabase SQL Editor
# Exécutez
```

### Option 2 : Vérifier les Logs du Serveur

Dans votre terminal où tourne `npm run dev`, regardez s'il y a des erreurs comme :

```
Error: function get_visitor_stats() does not exist
```

### Option 3 : Vérifier l'API

Testez l'API directement dans le navigateur :

```
http://localhost:3000/api/superuser/visitor-stats
```

**Si erreur 500 :** Problème avec la fonction SQL
**Si erreur 403 :** Problème de permissions
**Si erreur 401 :** Pas connecté

---

## ✅ Checklist de Résolution

- [ ] Fonction `get_visitor_stats()` existe
- [ ] Tables `visitors` et `page_views` existent
- [ ] Fonction retourne des résultats (même 0)
- [ ] API `/api/superuser/visitor-stats` répond
- [ ] Dashboard se charge sans erreur
- [ ] Statistiques s'affichent

---

## 🎯 Résumé

**Problème :** Dashboard figé, stats ne s'affichent pas

**Cause :** Fonction SQL `get_visitor_stats()` manquante ou en erreur

**Solution :** Créer/recréer la fonction avec le script ci-dessus

**Test :** Rafraîchir le dashboard après avoir exécuté le script

---

**Exécutez le script SQL de l'Étape 2 maintenant et dites-moi si ça débloque le dashboard !**
