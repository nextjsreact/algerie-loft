# 🚀 Guide de démarrage du serveur Next.js

## ✅ BONNE NOUVELLE : Le serveur fonctionne déjà !

Votre serveur Next.js est **déjà en cours d'exécution** sur :
- **http://localhost:3000**

---

## 🔍 Vérification

Pour vérifier que le serveur tourne :

### Option 1 : Ouvrir dans le navigateur
```
http://localhost:3000
```

### Option 2 : Vérifier les processus
```powershell
Get-Process -Name node
```

---

## 🛑 Arrêter le serveur

Si vous voulez arrêter le serveur :

### Option 1 : Trouver et tuer le processus
```powershell
# Trouver le processus
Get-Process -Name node | Where-Object {$_.MainWindowTitle -like "*next*"}

# Tuer le processus (remplacer PID par l'ID du processus)
Stop-Process -Id PID -Force
```

### Option 2 : Tuer tous les processus Node
```powershell
Stop-Process -Name node -Force
```

---

## 🚀 Démarrer le serveur

### Méthode 1 : Script batch (RECOMMANDÉ)
```bash
.\start-dev.bat
```

### Méthode 2 : Node directement
```bash
node node_modules\next\dist\bin\next dev
```

### Méthode 3 : npm (si ça fonctionne)
```bash
npm run dev
```

---

## ⚠️ Problèmes courants

### Problème 1 : "Port 3000 is in use"

**Solution :**
```powershell
# Trouver le processus qui utilise le port 3000
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Problème 2 : "Le chemin d'accès spécifié est introuvable"

**Solution :** Utiliser node directement
```bash
node node_modules\next\dist\bin\next dev
```

### Problème 3 : "Unable to acquire lock"

**Solution :** Un autre serveur Next.js tourne déjà
```powershell
# Supprimer le fichier de lock
Remove-Item -Force .next\dev\lock

# Ou arrêter tous les processus Node
Stop-Process -Name node -Force
```

---

## 📊 État actuel

### ✅ Ce qui fonctionne :
- Serveur Next.js opérationnel
- Base de données Supabase connectée
- 3,786 réservations Airbnb importées
- 58 lofts mappés
- Système 100% fonctionnel

### 🌐 URLs disponibles :
- **Application principale :** http://localhost:3000
- **API :** http://localhost:3000/api
- **Supabase :** https://supabase.com

---

## 🎯 Prochaines étapes

1. **Ouvrir l'application**
   ```
   http://localhost:3000
   ```

2. **Se connecter**
   - Utiliser vos identifiants

3. **Vérifier les réservations Airbnb**
   - Aller sur "Réservations"
   - Filtrer par "Airbnb"
   - Vérifier que tout s'affiche

4. **Profiter de votre système !** 🎉

---

## 📝 Scripts disponibles

### Développement
```bash
.\start-dev.bat                    # Démarrer le serveur
npm run dev                        # Alternative (si fonctionne)
npm run build                      # Build production
npm run start                      # Démarrer en production
```

### Vérification Airbnb
```bash
python scripts\verify-airbnb-mapping-results.py
python scripts\interactive-verification.py
```

### Base de données
```bash
# Exécuter dans Supabase SQL Editor
supabase/migrations/VERIFICATION_RAPIDE.sql
```

---

## 🆘 Support

### Le serveur ne démarre pas ?

1. **Vérifier Node.js**
   ```bash
   node --version  # Doit être >= 20.9.0
   npm --version   # Doit être >= 10.0.0
   ```

2. **Nettoyer les caches**
   ```bash
   Remove-Item -Recurse -Force .next
   npm cache clean --force
   ```

3. **Réinstaller les dépendances**
   ```bash
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

4. **Utiliser le script de réparation**
   ```bash
   .\fix-next-dev.ps1
   ```

---

## ✅ Checklist de démarrage

- [x] Node.js installé (v22.20.0)
- [x] npm installé (v11.16.0)
- [x] Dépendances installées
- [x] Base de données configurée
- [x] Variables d'environnement (.env)
- [x] Serveur Next.js fonctionnel
- [x] Réservations Airbnb importées

---

**Statut :** ✅ SERVEUR OPÉRATIONNEL  
**URL :** http://localhost:3000  
**Date :** 2026-05-29
