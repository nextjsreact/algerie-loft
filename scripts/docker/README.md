# Guide Docker - Airbnb Scraper avec CloakBrowser

## Vue d'ensemble

Cette configuration Docker permet d'exécuter le scraper Airbnb de manière isolée et reproductible, avec CloakBrowser pour le mode stealth.

---

## Installation

### Prérequis

- ✅ Docker Desktop installé et démarré
- ✅ Serveur Next.js accessible (localhost:3000)
- ✅ Identifiants Airbnb

### Étape 1: Préparer les fichiers

```powershell
# Copier les fichiers Docker
cd C:\Users\SERVICE-INFO\IA\algerie-loft
Copy-Item -Recurse "scripts\docker" -Destination "d:\Airbnb_transfer_v2\docker"

# Copier requirements.txt
Copy-Item "scripts\docker\requirements.txt" -Destination "d:\Airbnb_transfer_v2\requirements.txt"
```

### Étape 2: Configurer les variables d'environnement

```powershell
cd d:\Airbnb_transfer_v2\docker
Copy-Item ".env.example" -Destination ".env"
```

Éditez `.env` avec vos valeurs:
```env
AIRBNB_EMAIL=loft.algerie.scl@gmail.com
AIRBNB_PASSWORD=loft.algerie.2026
TOTP_SECRET=J135790
NEXTJS_API_URL=http://host.docker.internal:3000/api/airbnb/sync
NEXTJS_API_KEY=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
```

### Étape 3: Construire l'image Docker

```powershell
cd d:\Airbnb_transfer_v2
docker build -f docker/Dockerfile -t airbnb-scraper:latest .
```

**Durée:** 5-10 minutes (première fois)

---

## Utilisation

### Mode 1: Scraping manuel (complet)

Exécute un scraping complet de toutes les réservations.

```powershell
docker-compose --profile manual up airbnb-scraper-full
```

**Quand l'utiliser:**
- ✅ Première synchronisation
- ✅ Après avoir mappé de nouveaux lofts
- ✅ Une fois par semaine

### Mode 2: iCal Watcher (automatique)

Surveille les changements via iCal (léger, rapide).

```powershell
docker-compose --profile ical up -d airbnb-ical-watcher
```

**Quand l'utiliser:**
- ✅ Surveillance continue (toutes les heures)
- ✅ Détection des nouvelles réservations
- ✅ Mise à jour des statuts

### Mode 3: Targeted (quotidien)

Scraping ciblé des réservations récentes.

```powershell
docker-compose --profile targeted up -d airbnb-scraper-targeted
```

**Quand l'utiliser:**
- ✅ Synchronisation quotidienne
- ✅ Réservations des 30 derniers jours
- ✅ Équilibre entre performance et complétude

---

## Commandes utiles

### Voir les logs

```powershell
# Logs en temps réel
docker-compose logs -f airbnb-scraper-full

# Dernières 100 lignes
docker-compose logs --tail=100 airbnb-scraper-full
```

### Arrêter les services

```powershell
# Arrêter tous les services
docker-compose down

# Arrêter un service spécifique
docker-compose stop airbnb-ical-watcher
```

### Voir les fichiers de sortie

```powershell
# Lister les fichiers
docker run --rm -v airbnb-output:/data alpine ls -lh /data

# Copier les fichiers vers Windows
docker cp airbnb_scraper_full:/app/output/reservations_airbnb.csv ./
```

### Nettoyer

```powershell
# Supprimer les conteneurs
docker-compose down

# Supprimer l'image
docker rmi airbnb-scraper:latest

# Supprimer le volume (⚠️ supprime les données)
docker volume rm airbnb-output
```

---

## Configuration avancée

### Planification avec cron (Linux/Mac)

Ajoutez dans votre crontab:

```bash
# Scraping complet tous les dimanches à 3h du matin
0 3 * * 0 cd /path/to/docker && docker-compose --profile manual up airbnb-scraper-full

# iCal watcher toutes les heures
0 * * * * cd /path/to/docker && docker-compose --profile ical up airbnb-ical-watcher
```

### Planification avec Task Scheduler (Windows)

1. Ouvrez "Planificateur de tâches"
2. Créez une nouvelle tâche
3. Déclencheur: Quotidien à 3h
4. Action: Démarrer un programme
   - Programme: `docker-compose.exe`
   - Arguments: `--profile manual up airbnb-scraper-full`
   - Répertoire: `d:\Airbnb_transfer_v2\docker`

### Variables d'environnement supplémentaires

```env
# Désactiver le mode headless (pour debug)
HEADLESS=false

# Changer le timeout
TIMEOUT=60000

# Activer les logs détaillés
DEBUG=true
LOG_LEVEL=debug
```

---

## Dépannage

### Erreur: "Cannot connect to Docker daemon"

**Solution:** Démarrez Docker Desktop

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Erreur: "Port already in use"

**Solution:** Changez le port dans docker-compose.yml ou arrêtez le service qui utilise le port

```powershell
# Voir quel processus utilise le port 3000
netstat -ano | findstr :3000
```

### Erreur: "Cannot connect to API"

**Solution:** Vérifiez que le serveur Next.js est démarré et accessible

```powershell
# Tester l'API depuis Docker
docker run --rm curlimages/curl curl http://host.docker.internal:3000/api/airbnb/sync
```

### Erreur: "Login failed"

**Solution:** Vérifiez vos identifiants dans `.env`

```powershell
# Voir les variables d'environnement
docker-compose config
```

### Le scraper se bloque sur la 2FA

**Solution:** Configurez TOTP_SECRET dans `.env` pour automatiser la 2FA

---

## Monitoring

### Voir l'état des conteneurs

```powershell
docker ps -a --filter "name=airbnb"
```

### Voir l'utilisation des ressources

```powershell
docker stats airbnb_scraper_full
```

### Voir les logs de synchronisation dans Supabase

```sql
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_created,
  reservations_updated,
  conflicts_detected,
  started_at,
  duration_ms
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

---

## Sécurité

### ⚠️ Ne commitez JAMAIS le fichier .env

Le fichier `.env` contient vos identifiants. Ajoutez-le au `.gitignore`:

```
docker/.env
```

### 🔒 Utilisez des secrets Docker (production)

Pour la production, utilisez Docker secrets au lieu de variables d'environnement:

```yaml
secrets:
  airbnb_password:
    file: ./secrets/airbnb_password.txt
```

---

## Performance

### Optimisations

1. **Utilisez iCal watcher** pour la surveillance continue (plus léger)
2. **Limitez le scraping complet** à 1 fois par semaine
3. **Utilisez targeted** pour les syncs quotidiens
4. **Configurez un cache** pour les URLs iCal

### Ressources recommandées

- **CPU:** 2 cores minimum
- **RAM:** 2 GB minimum
- **Disque:** 5 GB minimum (pour les images Docker)

---

## Support

Pour toute question ou problème:
1. Vérifiez les logs: `docker-compose logs`
2. Vérifiez la configuration: `docker-compose config`
3. Testez l'API manuellement: `python test-with-sample-data.py`
