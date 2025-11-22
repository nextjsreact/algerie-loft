# Guide d'Installation du Système de Tracking des Visiteurs

## Vue d'ensemble

Le système de tracking des visiteurs permet de suivre :
- **Total des visiteurs** depuis le début
- **Visiteurs du jour** (nouveaux et retours)
- **Pages vues** (total et aujourd'hui)
- **Durée moyenne des sessions**

## Installation

### Étape 1: Déployer le schéma de base de données

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `database/visitor-tracking-schema.sql`
5. Cliquez sur **Run** pour exécuter le script

Cela créera :
- Table `visitors` - pour stocker les visiteurs uniques
- Table `page_views` - pour stocker les vues de pages
- Fonctions SQL pour les statistiques
- Politiques RLS pour la sécurité

### Étape 2: Vérifier l'installation

Exécutez cette requête pour vérifier que tout est en place :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('visitors', 'page_views');

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_visitor_stats', 'get_visitor_trends', 'record_visitor');
```

### Étape 3: Tester les statistiques

Vous pouvez tester manuellement en insérant des données de test :

```sql
-- Insérer un visiteur de test
SELECT record_visitor(
    'test-session-123',
    '127.0.0.1'::inet,
    'Mozilla/5.0',
    'https://google.com',
    '/fr',
    'desktop',
    'Chrome',
    'Windows'
);

-- Vérifier les statistiques
SELECT * FROM get_visitor_stats();
```

## Utilisation

### Dans le Dashboard Superuser

Les statistiques s'affichent automatiquement dans le dashboard superuser :

1. Connectez-vous en tant que superuser
2. Allez sur `/admin/superuser/dashboard`
3. Vous verrez 4 cartes en haut :
   - 🔵 **Total Visiteurs** - Nombre total depuis le début
   - 🟢 **Visiteurs Aujourd'hui** - Visiteurs du jour (avec nouveaux)
   - 🟣 **Total Pages Vues** - Pages vues (total et aujourd'hui)
   - 🟠 **Durée Moyenne** - Temps moyen par session

### Tracking Automatique (Optionnel)

Pour activer le tracking automatique des visiteurs, ajoutez ce code dans votre layout principal :

```typescript
// app/[locale]/layout.tsx ou components/providers/client-providers-nextintl.tsx

useEffect(() => {
  // Générer ou récupérer un ID de session
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }

  // Détecter le type d'appareil
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Enregistrer la visite
  fetch('/api/track-visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      referrer: document.referrer,
      landingPage: window.location.pathname,
      deviceType: getDeviceType(),
      browser: navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/i)?.[0] || 'unknown',
      os: navigator.platform
    })
  }).catch(err => console.error('Failed to track visitor:', err));
}, []);
```

## API Endpoints

### GET /api/superuser/visitor-stats

Récupère les statistiques des visiteurs (réservé aux superusers).

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "total_visitors": 1234,
    "today_visitors": 56,
    "unique_today": 23,
    "total_page_views": 5678,
    "today_page_views": 234,
    "avg_session_duration": 180.5
  },
  "trends": [
    {
      "date": "2024-01-15",
      "new_visitors": 10,
      "returning_visitors": 5,
      "total_page_views": 50
    }
  ]
}
```

### POST /api/track-visitor

Enregistre une visite (accessible publiquement).

**Body :**
```json
{
  "sessionId": "session_123",
  "referrer": "https://google.com",
  "landingPage": "/fr",
  "deviceType": "desktop",
  "browser": "Chrome",
  "os": "Windows"
}
```

## Sécurité

- ✅ Les tables utilisent RLS (Row Level Security)
- ✅ Seuls les superusers peuvent lire les données
- ✅ L'insertion publique est autorisée pour le tracking
- ✅ Les adresses IP sont stockées de manière sécurisée
- ✅ Pas de données personnelles identifiables

## Maintenance

### Nettoyer les anciennes données

Pour supprimer les données de plus de 90 jours :

```sql
-- Supprimer les anciennes vues de pages
DELETE FROM page_views 
WHERE viewed_at < NOW() - INTERVAL '90 days';

-- Supprimer les anciens visiteurs inactifs
DELETE FROM visitors 
WHERE last_visit < NOW() - INTERVAL '90 days';
```

### Optimiser les performances

```sql
-- Analyser les tables
ANALYZE visitors;
ANALYZE page_views;

-- Reconstruire les index si nécessaire
REINDEX TABLE visitors;
REINDEX TABLE page_views;
```

## Dépannage

### Les statistiques ne s'affichent pas

1. Vérifiez que vous êtes connecté en tant que superuser
2. Vérifiez que les tables existent dans Supabase
3. Vérifiez les logs de la console du navigateur (F12)
4. Vérifiez les logs de l'API dans Supabase

### Les visiteurs ne sont pas enregistrés

1. Vérifiez que la fonction `record_visitor` existe
2. Vérifiez les permissions RLS
3. Testez manuellement avec la requête SQL ci-dessus

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Supabase
2. Vérifiez la console du navigateur
3. Testez les fonctions SQL manuellement
4. Vérifiez que votre rôle superuser est actif
