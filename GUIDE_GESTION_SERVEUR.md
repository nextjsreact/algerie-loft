# 🚀 Guide Complet : Gérer le Serveur Next.js

## 🔍 POURQUOI `npm run dev` NE FONCTIONNE PAS ?

### Le problème

Quand vous exécutez `npm run dev`, npm essaie de lancer la commande :
```bash
next dev
```

**Mais** : Le binaire `next` n'est pas dans le PATH de Windows, donc npm ne peut pas le trouver.

### Erreur rencontrée
```
Le chemin d'accès spécifié est introuvable.
```

### Pourquoi ça arrive ?

Sur Windows, npm a parfois du mal à trouver les binaires dans `node_modules\.bin\`. C'est un problème connu avec :
- Certaines versions de npm
- Certaines configurations de Windows
- Les chemins longs sous Windows

---

## ✅ SOLUTIONS POUR DÉMARRER LE SERVEUR

### Solution 1 : Script Batch (RECOMMANDÉ) ⭐

**Le plus simple et le plus fiable**

```bash
.\start-dev.bat
```

**Avantages :**
- ✅ Fonctionne toujours
- ✅ Un seul clic
- ✅ Pas besoin de taper de longues commandes

---

### Solution 2 : Node directement

```bash
node node_modules\next\dist\bin\next dev
```

**Avantages :**
- ✅ Fonctionne toujours
- ✅ Pas besoin de script

**Inconvénients :**
- ❌ Commande longue à taper

---

### Solution 3 : npx (Alternative)

```bash
npx next dev
```

**Avantages :**
- ✅ Plus court que la solution 2
- ✅ npx trouve automatiquement le binaire

**Inconvénients :**
- ⚠️ Peut être plus lent au démarrage

---

### Solution 4 : Réparer npm (Avancé)

Si vous voulez vraiment que `npm run dev` fonctionne :

```powershell
# 1. Nettoyer le cache npm
npm cache clean --force

# 2. Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# 3. Supprimer package-lock.json
Remove-Item package-lock.json

# 4. Réinstaller
npm install

# 5. Tester
npm run dev
```

**Note :** Même après ça, ça peut ne pas fonctionner sur certains systèmes Windows.

---

## 🛑 COMMENT ARRÊTER LE SERVEUR

### Méthode 1 : Trouver et arrêter le processus (RECOMMANDÉ)

```powershell
# 1. Trouver le processus qui utilise le port 3000
netstat -ano | findstr :3000

# Vous verrez quelque chose comme :
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    53152
#                                                   ^^^^^
#                                                   PID (Process ID)

# 2. Arrêter le processus (remplacer 53152 par votre PID)
taskkill /PID 53152 /F
```

---

### Méthode 2 : Arrêter tous les processus Node

**⚠️ ATTENTION : Ceci arrête TOUS les processus Node.js**

```powershell
taskkill /IM node.exe /F
```

**Utilisez cette méthode seulement si :**
- Vous n'avez pas d'autres applications Node.js en cours
- Vous voulez tout arrêter rapidement

---

### Méthode 3 : Script PowerShell

Créez un fichier `stop-dev.ps1` :

```powershell
# Trouver le processus sur le port 3000
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Arrêt du serveur (PID: $process)..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "✅ Serveur arrêté !" -ForegroundColor Green
} else {
    Write-Host "❌ Aucun serveur trouvé sur le port $port" -ForegroundColor Red
}
```

Puis exécutez :
```powershell
.\stop-dev.ps1
```

---

### Méthode 4 : Gestionnaire des tâches (Interface graphique)

1. Ouvrir le Gestionnaire des tâches (Ctrl + Shift + Esc)
2. Aller dans l'onglet "Détails"
3. Chercher "node.exe"
4. Clic droit → "Fin de tâche"

---

## 📋 SCRIPT COMPLET DE GESTION

Créez un fichier `manage-server.bat` :

```batch
@echo off
echo ================================
echo   GESTION DU SERVEUR NEXT.JS
echo ================================
echo.
echo 1. Démarrer le serveur
echo 2. Arrêter le serveur
echo 3. Redémarrer le serveur
echo 4. Vérifier le statut
echo 5. Quitter
echo.
set /p choice="Votre choix (1-5) : "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto end

:start
echo.
echo Démarrage du serveur...
node node_modules\next\dist\bin\next dev
goto end

:stop
echo.
echo Arrêt du serveur...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F
    echo Serveur arrêté (PID: %%a)
)
goto end

:restart
echo.
echo Redémarrage du serveur...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto end

:status
echo.
echo Vérification du statut...
netstat -ano | findstr :3000
if errorlevel 1 (
    echo ❌ Serveur arrêté
) else (
    echo ✅ Serveur en cours d'exécution
)
pause
goto end

:end
```

---

## 🎯 UTILISATION QUOTIDIENNE

### Démarrer le serveur le matin

```bash
.\start-dev.bat
```

Ou :

```bash
node node_modules\next\dist\bin\next dev
```

### Arrêter le serveur le soir

```powershell
# Trouver le PID
netstat -ano | findstr :3000

# Arrêter (remplacer 53152 par votre PID)
taskkill /PID 53152 /F
```

### Vérifier si le serveur tourne

```powershell
netstat -ano | findstr :3000
```

Si vous voyez des lignes, le serveur tourne.  
Si rien ne s'affiche, le serveur est arrêté.

---

## 🔧 DÉPANNAGE

### Problème : "Port 3000 is already in use"

**Solution :**

```powershell
# Option 1 : Arrêter le processus sur le port 3000
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Option 2 : Utiliser un autre port
node node_modules\next\dist\bin\next dev -p 3001
```

---

### Problème : "Cannot find module 'next'"

**Solution :**

```bash
# Réinstaller les dépendances
npm install
```

---

### Problème : Le serveur démarre mais ne répond pas

**Solution :**

```powershell
# 1. Vérifier les logs
# Regarder les erreurs dans le terminal

# 2. Nettoyer le cache
Remove-Item -Recurse -Force .next
node node_modules\next\dist\bin\next dev

# 3. Vérifier les variables d'environnement
# S'assurer que .env existe et est correct
```

---

### Problème : "EADDRINUSE: address already in use"

**Solution :**

```powershell
# Un autre processus utilise le port 3000
# Trouver et arrêter ce processus
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

## 📊 COMMANDES UTILES

### Vérifier la version de Node et npm

```bash
node --version   # Doit être >= 20.9.0
npm --version    # Doit être >= 10.0.0
```

### Vérifier les processus Node en cours

```powershell
Get-Process -Name node
```

### Vérifier les ports utilisés

```powershell
netstat -ano | findstr LISTENING
```

### Nettoyer complètement

```powershell
# Arrêter tous les processus Node
taskkill /IM node.exe /F

# Supprimer les caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# Redémarrer
node node_modules\next\dist\bin\next dev
```

---

## 🎓 COMPRENDRE LE PROBLÈME

### Pourquoi `npm run dev` devrait fonctionner ?

Quand vous installez un package npm avec un binaire (comme `next`), npm crée un lien dans `node_modules\.bin\`.

Normalement, quand vous exécutez `npm run [script]`, npm ajoute automatiquement `node_modules\.bin` au PATH temporairement.

### Pourquoi ça ne fonctionne pas sur votre système ?

Plusieurs raisons possibles :

1. **Chemins longs Windows** : Windows a une limite de 260 caractères pour les chemins
2. **Permissions** : Problèmes de permissions sur `node_modules\.bin`
3. **Antivirus** : Certains antivirus bloquent l'exécution de scripts
4. **Version de npm** : Certaines versions ont des bugs sur Windows
5. **Configuration PowerShell** : Politique d'exécution restrictive

### La solution de contournement

Au lieu de laisser npm trouver le binaire, on lui donne le chemin complet :

```bash
node node_modules\next\dist\bin\next dev
```

Ceci fonctionne toujours car :
- ✅ `node` est dans le PATH système
- ✅ Le chemin vers `next` est explicite
- ✅ Pas besoin que npm trouve le binaire

---

## 📝 RÉSUMÉ

### Pour démarrer le serveur :

**Option 1 (Recommandée) :**
```bash
.\start-dev.bat
```

**Option 2 :**
```bash
node node_modules\next\dist\bin\next dev
```

**Option 3 :**
```bash
npx next dev
```

### Pour arrêter le serveur :

**Option 1 (Recommandée) :**
```powershell
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Option 2 (Rapide mais brutal) :**
```powershell
taskkill /IM node.exe /F
```

### Pourquoi `npm run dev` ne fonctionne pas :

- npm ne trouve pas le binaire `next` dans le PATH
- C'est un problème connu sur Windows
- Les solutions de contournement fonctionnent parfaitement

---

## ✅ CHECKLIST

- [ ] J'ai testé `.\start-dev.bat` → ça fonctionne
- [ ] Je sais comment arrêter le serveur avec `taskkill`
- [ ] Je sais vérifier si le serveur tourne avec `netstat`
- [ ] Je comprends pourquoi `npm run dev` ne fonctionne pas
- [ ] J'ai sauvegardé ce guide pour référence future

---

**Date :** 2026-05-29  
**Système :** Windows  
**Node.js :** v22.20.0  
**npm :** v11.16.0  
**Next.js :** 16.1.1

