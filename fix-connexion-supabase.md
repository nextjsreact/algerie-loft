# 🔧 Résoudre le Problème de Connexion Supabase

## ❌ Erreur Détectée

```
[Error: getaddrinfo ENOTFOUND mhngbluefyucoesgcjoy.supabase.co]
errno: -3008
code: 'ENOTFOUND'
```

**Signification:** Ton ordinateur ne peut pas résoudre le nom de domaine Supabase.

---

## 🔍 Causes Possibles

1. ❌ Pas de connexion Internet
2. ❌ Problème DNS
3. ❌ Pare-feu bloquant Supabase
4. ❌ VPN/Proxy interférant
5. ❌ Cloudflare WARP actif

---

## ✅ Solutions (Dans l'Ordre)

### Solution 1: Vérifier la Connexion Internet

```powershell
# Tester la connexion
ping google.com

# Tester Supabase directement
ping mhngbluefyucoesgcjoy.supabase.co
```

**Si ça ne ping pas:** Problème de connexion Internet ou DNS

---

### Solution 2: Changer les DNS

#### Option A: Utiliser Google DNS
```powershell
# Ouvrir les paramètres réseau
ncpa.cpl
```

Puis:
1. Clic droit sur ta connexion → Propriétés
2. Double-clic sur "Protocole Internet Version 4 (TCP/IPv4)"
3. Sélectionner "Utiliser les adresses de serveur DNS suivantes"
4. DNS préféré: `8.8.8.8`
5. DNS auxiliaire: `8.8.4.4`
6. OK → OK

#### Option B: Utiliser Cloudflare DNS
- DNS préféré: `1.1.1.1`
- DNS auxiliaire: `1.0.0.1`

---

### Solution 3: Vider le Cache DNS

```powershell
# Vider le cache DNS Windows
ipconfig /flushdns

# Redémarrer le service DNS
Restart-Service -Name "Dnscache" -Force
```

---

### Solution 4: Désactiver Cloudflare WARP (Si Installé)

Si tu as Cloudflare WARP installé:
1. Ouvrir l'application WARP
2. Cliquer sur l'icône
3. Désactiver temporairement
4. Réessayer

---

### Solution 5: Vérifier le Pare-feu

```powershell
# Vérifier si le pare-feu bloque
Test-NetConnection -ComputerName mhngbluefyucoesgcjoy.supabase.co -Port 443
```

Si bloqué:
1. Ouvrir "Pare-feu Windows Defender"
2. Paramètres avancés
3. Règles de sortie
4. Autoriser Node.js et npm

---

### Solution 6: Utiliser un VPN (Si Bloqué)

Si Supabase est bloqué par ton FAI ou réseau:
1. Utiliser un VPN
2. Ou utiliser un hotspot mobile

---

### Solution 7: Vérifier les Variables d'Environnement

```powershell
# Vérifier que l'URL Supabase est correcte
Get-Content .env.local | Select-String "SUPABASE_URL"
```

**Doit contenir:**
```
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co
```

---

## 🚀 Procédure Rapide

### Étape 1: Vider le Cache DNS
```powershell
ipconfig /flushdns
```

### Étape 2: Changer les DNS vers Google
1. `ncpa.cpl`
2. Propriétés de la connexion
3. IPv4 → DNS: `8.8.8.8` et `8.8.4.4`

### Étape 3: Redémarrer l'Application
```powershell
# Arrêter l'app (Ctrl+C)
# Puis redémarrer
npm run dev
```

---

## 🧪 Tester la Connexion

### Test 1: Ping
```powershell
ping mhngbluefyucoesgcjoy.supabase.co
```

**Résultat attendu:**
```
Réponse de xxx.xxx.xxx.xxx : octets=32 temps=XXms TTL=XX
```

### Test 2: Curl (Si Disponible)
```powershell
curl https://mhngbluefyucoesgcjoy.supabase.co
```

### Test 3: Navigateur
Ouvrir dans le navigateur:
```
https://mhngbluefyucoesgcjoy.supabase.co
```

**Doit afficher:** Une page Supabase (même si erreur 404, c'est OK)

---

## 📊 Diagnostic Complet

```powershell
# 1. Vérifier la connexion Internet
ping google.com

# 2. Vérifier Supabase
ping mhngbluefyucoesgcjoy.supabase.co

# 3. Vérifier le port HTTPS
Test-NetConnection -ComputerName mhngbluefyucoesgcjoy.supabase.co -Port 443

# 4. Vérifier les DNS actuels
ipconfig /all | Select-String "DNS"

# 5. Vider le cache
ipconfig /flushdns
```

---

## ⚠️ Si Rien ne Fonctionne

### Option 1: Utiliser un Hotspot Mobile
1. Activer le partage de connexion sur ton téléphone
2. Connecter ton PC au hotspot
3. Réessayer

### Option 2: Vérifier avec l'Administrateur Réseau
Si tu es sur un réseau d'entreprise:
- Supabase peut être bloqué
- Demander à débloquer `*.supabase.co`

### Option 3: Utiliser un VPN
- ProtonVPN (gratuit)
- Cloudflare WARP (gratuit)
- Ou tout autre VPN

---

## ✅ Une Fois Résolu

```powershell
# Redémarrer l'application
npm run dev
```

L'application devrait maintenant se connecter à Supabase sans erreur!

---

## 🎯 Résumé Rapide

```powershell
# 1. Vider le cache DNS
ipconfig /flushdns

# 2. Changer DNS vers Google (8.8.8.8)
ncpa.cpl

# 3. Redémarrer l'app
npm run dev
```

---

**💡 Astuce:** Si le problème persiste, c'est probablement un blocage réseau. Utilise un hotspot mobile pour tester.

---

*Guide de dépannage connexion Supabase - 2 Décembre 2024*
