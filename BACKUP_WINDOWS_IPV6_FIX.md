# 🔧 Correction IPv6 pour Windows - Backups Supabase

## ❌ Problème Identifié

```
Network is unreachable (0x00002743/10051)
```

**Cause** : Supabase utilise IPv6, mais votre Windows n'a pas de connectivité IPv6 active.

## 🎯 Solutions (par ordre de préférence)

### Solution 1 : Activer IPv6 sur Windows (Recommandé)

#### Vérifier l'état IPv6
```powershell
# PowerShell en administrateur
Get-NetAdapterBinding -ComponentID ms_tcpip6

# Ou
ipconfig /all | findstr "IPv6"
```

#### Activer IPv6
```powershell
# PowerShell en administrateur
Enable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6

# Redémarrer l'adaptateur réseau
Restart-NetAdapter -Name "Ethernet"  # ou "Wi-Fi"
```

#### Vérifier la connectivité IPv6
```powershell
# Tester la connectivité
ping -6 ipv6.google.com

# Tester Supabase
ping -6 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
```

### Solution 2 : Utiliser Cloudflare WARP (Tunnel IPv6)

**Cloudflare WARP** fournit un tunnel IPv6 gratuit :

1. **Télécharger** : https://1.1.1.1/
2. **Installer** Cloudflare WARP
3. **Activer** le mode WARP
4. **Tester** : `ping -6 ipv6.google.com`

### Solution 3 : Utiliser Teredo (Tunnel IPv6 Windows)

```powershell
# PowerShell en administrateur

# Activer Teredo
netsh interface teredo set state enterpriseclient

# Vérifier l'état
netsh interface teredo show state

# Tester
ping -6 ipv6.google.com
```

### Solution 4 : Utiliser un Proxy Local

Créer un proxy local qui convertit IPv4 → IPv6 :

```javascript
// proxy-ipv6.js
const net = require('net');

const proxy = net.createServer((clientSocket) => {
  const serverSocket = net.connect({
    host: '2a05:d014:1c06:5f11:e7f2:7088:c72:86f2',
    port: 5432,
    family: 6 // Force IPv6
  });

  clientSocket.pipe(serverSocket);
  serverSocket.pipe(clientSocket);
});

proxy.listen(15432, '127.0.0.1', () => {
  console.log('Proxy IPv6 listening on 127.0.0.1:15432');
});
```

Puis utiliser : `localhost:15432` au lieu de l'adresse Supabase.

### Solution 5 : Utiliser l'API Supabase au lieu de pg_dump

Modifier le backup pour utiliser l'API REST Supabase :

```typescript
// Alternative : Export via API Supabase
async function backupViaAPI() {
  const supabase = createClient();
  
  // Récupérer toutes les tables
  const tables = await getAllTableNames();
  
  // Exporter chaque table
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*');
    // Sauvegarder en JSON ou SQL
  }
}
```

### Solution 6 : Utiliser SSH Tunnel via WSL

Si vous avez WSL (Windows Subsystem for Linux) :

```bash
# Dans WSL
ssh -L 15432:db.mhngbluefyucoesgcjoy.supabase.co:5432 user@server-with-ipv6

# Puis utiliser localhost:15432
```

## 🔍 Diagnostic Complet

### Étape 1 : Vérifier IPv6 sur votre système
```powershell
# PowerShell
ipconfig /all

# Chercher "IPv6 Address" ou "Adresse IPv6"
# Si vous voyez seulement "fe80::" (link-local), IPv6 n'est pas routé
```

### Étape 2 : Tester la connectivité Supabase
```powershell
# Test IPv6
ping -6 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2

# Test hostname
ping db.mhngbluefyucoesgcjoy.supabase.co
```

### Étape 3 : Vérifier les routes IPv6
```powershell
# PowerShell
netsh interface ipv6 show route
```

### Étape 4 : Vérifier le pare-feu
```powershell
# Vérifier si le pare-feu bloque IPv6
Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True' -and $_.Direction -eq 'Outbound'}
```

## 🚀 Solution Rapide (Temporaire)

### Utiliser un VPN avec support IPv6

**VPN gratuits avec IPv6** :
- Cloudflare WARP (gratuit, recommandé)
- ProtonVPN (gratuit)
- Hurricane Electric Tunnel Broker (gratuit)

### Cloudflare WARP - Installation Rapide

1. **Télécharger** : https://1.1.1.1/
2. **Installer** et lancer
3. **Cliquer** sur le bouton pour activer
4. **Tester** :
   ```powershell
   ping -6 ipv6.google.com
   ping -6 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
   ```
5. **Réessayer** le backup

## 📝 Configuration Alternative : Forcer IPv4

Si Supabase a une adresse IPv4 (à vérifier) :

```powershell
# Résoudre en IPv4 uniquement
nslookup -type=A db.mhngbluefyucoesgcjoy.supabase.co 8.8.8.8
```

Si une IPv4 existe, l'ajouter dans hosts :
```
# C:\Windows\System32\drivers\etc\hosts
XXX.XXX.XXX.XXX db.mhngbluefyucoesgcjoy.supabase.co
```

## 🔧 Modification du Code (Alternative)

### Option A : Désactiver le retry IPv6

Dans `.env.local` :
```env
DISABLE_IPV6_BACKUP=true
```

### Option B : Utiliser un proxy local

Dans `.env.local` :
```env
SUPABASE_DB_PROXY=localhost:15432
```

## 📊 Vérifier l'État Actuel

```sql
-- Voir les backups échoués
SELECT 
    id,
    started_at,
    error_message
FROM backup_records 
WHERE status = 'FAILED'
  AND error_message LIKE '%Network is unreachable%'
ORDER BY started_at DESC;
```

## ✅ Solution Recommandée pour Vous

**Étape 1 : Installer Cloudflare WARP**
```
1. Télécharger : https://1.1.1.1/
2. Installer
3. Activer WARP
4. Attendre 30 secondes
```

**Étape 2 : Vérifier la connectivité**
```powershell
ping -6 2a05:d014:1c06:5f11:e7f2:7088:c72:86f2
```

**Étape 3 : Réessayer le backup**
```
1. Aller sur /fr/admin/superuser/backup
2. Cliquer sur "Sauvegarde Complète Immédiate"
3. Devrait fonctionner maintenant ✅
```

## 🆘 Si Rien ne Fonctionne

### Utiliser l'Export Manuel via Supabase Dashboard

1. **Aller sur** : https://supabase.com/dashboard
2. **Sélectionner** votre projet
3. **Database** → **Backups**
4. **Download** le backup
5. **Copier** dans votre dossier `/backups`

### Ou Utiliser l'API Supabase Management

```bash
# Avec curl
curl -X POST https://api.supabase.com/v1/projects/{ref}/database/backups \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

## 📞 Résumé

**Problème** : Windows sans IPv6 ne peut pas se connecter à Supabase (IPv6 only)

**Solution la plus simple** : Installer Cloudflare WARP (2 minutes)

**Solution permanente** : Activer IPv6 sur Windows

**Solution alternative** : Utiliser l'API Supabase au lieu de pg_dump

Testez Cloudflare WARP en premier - c'est la solution la plus rapide ! 🚀
