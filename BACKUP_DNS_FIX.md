# 🔧 Correction du Problème DNS pour les Backups

## ❌ Erreur Rencontrée

```
pg_dump: error: could not translate host name "db.mhngbluefyucoesgcjoy.supabase.co" to address: 
Temporary failure in name resolution
```

## ✅ Solution Implémentée

Le système tente maintenant automatiquement de :
1. **Résoudre l'IP** du hostname Supabase
2. **Réessayer** avec l'IP résolue
3. **Utiliser un fallback IPv6** si nécessaire

## 🔄 Logique de Retry

```typescript
1. Tentative avec hostname : db.xxxxx.supabase.co
   ↓ (échec DNS)
2. Résolution DNS → IPv4 ou IPv6
   ↓
3. Retry avec IP résolue
   ↓
4. Si échec → Fallback IPv6 hardcodé (pour votre projet)
   ↓
5. Retry final
```

## 🛠️ Solutions Alternatives

### Solution 1 : Ajouter l'IP dans hosts (Recommandé)

**Windows** (`C:\Windows\System32\drivers\etc\hosts`) :
```
# Ouvrir en tant qu'administrateur
notepad C:\Windows\System32\drivers\etc\hosts

# Ajouter cette ligne (remplacer par votre IP résolue)
2a05:d014:1c06:5f11:e7f2:7088:c72:86f2 db.mhngbluefyucoesgcjoy.supabase.co
```

**Linux/Mac** (`/etc/hosts`) :
```bash
sudo nano /etc/hosts

# Ajouter cette ligne
2a05:d014:1c06:5f11:e7f2:7088:c72:86f2 db.mhngbluefyucoesgcjoy.supabase.co
```

### Solution 2 : Changer de DNS

**Windows** :
```
1. Panneau de configuration → Réseau et Internet
2. Centre Réseau et partage → Modifier les paramètres de la carte
3. Clic droit sur votre connexion → Propriétés
4. IPv4 → Propriétés
5. Utiliser les serveurs DNS suivants :
   - Préféré : 8.8.8.8 (Google)
   - Auxiliaire : 1.1.1.1 (Cloudflare)
```

**Linux** :
```bash
# Modifier /etc/resolv.conf
sudo nano /etc/resolv.conf

# Ajouter
nameserver 8.8.8.8
nameserver 1.1.1.1
```

**macOS** :
```
1. Préférences Système → Réseau
2. Sélectionner votre connexion → Avancé
3. DNS → Ajouter 8.8.8.8 et 1.1.1.1
```

### Solution 3 : Vider le Cache DNS

**Windows** :
```powershell
# PowerShell en administrateur
ipconfig /flushdns
```

**Linux** :
```bash
sudo systemd-resolve --flush-caches
# OU
sudo service nscd restart
```

**macOS** :
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Solution 4 : Utiliser l'IP Directement

Modifier la configuration pour utiliser l'IP au lieu du hostname :

```typescript
// Dans .env.local, ajouter
SUPABASE_DB_HOST_IP=2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
```

Puis modifier le code pour utiliser cette variable si disponible.

## 🔍 Diagnostiquer le Problème

### Test 1 : Ping le serveur
```bash
# Windows/Linux/Mac
ping db.mhngbluefyucoesgcjoy.supabase.co

# Si échec, problème DNS confirmé
```

### Test 2 : Résolution DNS manuelle
```bash
# Windows
nslookup db.mhngbluefyucoesgcjoy.supabase.co

# Linux/Mac
dig db.mhngbluefyucoesgcjoy.supabase.co
host db.mhngbluefyucoesgcjoy.supabase.co
```

### Test 3 : Test de connexion PostgreSQL
```bash
# Avec hostname
psql -h db.mhngbluefyucoesgcjoy.supabase.co -U postgres -d postgres

# Avec IP (si résolu)
psql -h 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2 -U postgres -d postgres
```

### Test 4 : Vérifier pg_dump
```bash
# Test simple
pg_dump --version

# Test avec votre serveur
pg_dump -h db.mhngbluefyucoesgcjoy.supabase.co -U postgres -d postgres --schema-only
```

## 📊 Vérifier les Logs

### Dans la console du serveur
```bash
# Chercher les messages de retry DNS
grep "DNS resolution failed" logs/*.log
grep "Resolved.*to.*Retrying" logs/*.log
```

### Dans la base de données
```sql
-- Voir les erreurs de backup
SELECT 
    id,
    started_at,
    error_message
FROM backup_records 
WHERE status = 'FAILED'
ORDER BY started_at DESC
LIMIT 10;

-- Chercher les erreurs DNS spécifiques
SELECT * FROM backup_records 
WHERE error_message LIKE '%could not translate host name%'
   OR error_message LIKE '%name resolution%';
```

## 🎯 Tester la Correction

### Test 1 : Créer une nouvelle sauvegarde
```
1. Aller sur /fr/admin/superuser/backup
2. Cliquer sur "Sauvegarde Complète Immédiate"
3. Attendre 30 secondes
4. Vérifier le statut
```

### Test 2 : Vérifier les logs
```bash
# Dans le terminal du serveur
# Chercher les messages de retry
tail -f .next/server.log | grep -i "dns\|resolved\|retry"
```

### Test 3 : Vérifier le fichier créé
```bash
# Lister les backups
ls -lh backups/*.sql

# Vérifier le contenu (premières lignes)
head -n 20 backups/full_*.sql
```

## 🔐 IPv6 vs IPv4

### Votre Projet Utilise IPv6
```
2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
```

### Si IPv6 ne fonctionne pas

Forcer IPv4 dans pg_dump :
```bash
# Résoudre en IPv4 uniquement
nslookup -type=A db.mhngbluefyucoesgcjoy.supabase.co

# Utiliser l'IP IPv4 dans hosts
```

## 📝 Résumé des Changements

### Avant (❌ Échouait)
```typescript
// Tentative unique avec hostname
pg_dump -h db.xxxxx.supabase.co ...
// → Erreur DNS → Échec immédiat
```

### Après (✅ Retry automatique)
```typescript
// Tentative 1 : hostname
pg_dump -h db.xxxxx.supabase.co ...
// → Erreur DNS détectée

// Résolution DNS
const ip = await resolveHostToIp('db.xxxxx.supabase.co')
// → 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2

// Tentative 2 : avec IP
pg_dump -h 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2 ...
// → Succès ✅
```

## 🚀 Prochaines Étapes

1. **Tester** : Créer une nouvelle sauvegarde
2. **Vérifier** : Le fichier dans `/backups`
3. **Confirmer** : Statut "Terminé" dans l'interface
4. **Optionnel** : Ajouter l'IP dans hosts pour éviter le retry

## 📞 Si le Problème Persiste

1. Vérifier la connexion Internet
2. Vérifier que Supabase est accessible
3. Essayer avec un autre DNS (8.8.8.8)
4. Vérifier les logs détaillés
5. Contacter le support Supabase si le serveur est inaccessible
