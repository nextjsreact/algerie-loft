# 🔧 Commandes PowerShell pour Windows

## 🎯 Vous Utilisez PowerShell

Voici les bonnes commandes pour votre environnement.

---

## 🗑️ Supprimer le Cache Next.js

### Commande Complète
```powershell
Remove-Item -Recurse -Force .next
```

### Commande Courte
```powershell
rm -r -fo .next
```

### Avec Vérification
```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

---

## 🔄 Redémarrer le Serveur

### Méthode 1 : Manuelle

```powershell
# 1. Arrêter le serveur
# Appuyez sur Ctrl+C dans le terminal où tourne npm run dev

# 2. Supprimer le cache
Remove-Item -Recurse -Force .next

# 3. Redémarrer
npm run dev
```

### Méthode 2 : Script Automatique PowerShell

```powershell
.\fix-partners-interface.ps1
```

### Méthode 3 : Script Automatique Batch (CMD)

```cmd
fix-partners-interface.bat
```

---

## 🛑 Arrêter Tous les Processus Node

```powershell
Get-Process -Name node | Stop-Process -Force
```

Ou :

```powershell
taskkill /F /IM node.exe
```

---

## 📋 Vérifier si le Cache Existe

```powershell
Test-Path .next
```

Retourne `True` si le dossier existe, `False` sinon.

---

## 🧹 Nettoyage Complet

```powershell
# Arrêter Node
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Supprimer .next
if (Test-Path .next) { Remove-Item -Recurse -Force .next }

# Nettoyer npm cache
npm cache clean --force

# Redémarrer
npm run dev
```

---

## 📁 Lister les Fichiers

```powershell
# Liste simple
ls

# Liste détaillée
ls -Force

# Liste récursive
ls -Recurse
```

---

## 🔍 Différences CMD vs PowerShell

| Action | CMD | PowerShell |
|--------|-----|------------|
| Supprimer dossier | `rmdir /s /q .next` | `Remove-Item -Recurse -Force .next` |
| Lister fichiers | `dir` | `Get-ChildItem` ou `ls` |
| Copier fichier | `copy` | `Copy-Item` |
| Déplacer fichier | `move` | `Move-Item` |
| Tuer processus | `taskkill /F /IM node.exe` | `Stop-Process -Name node -Force` |

---

## ⚡ Scripts Disponibles

### PowerShell (Recommandé pour vous)
```powershell
.\fix-partners-interface.ps1
```

**Avantages :**
- ✅ Couleurs dans la sortie
- ✅ Gestion d'erreurs
- ✅ Messages clairs
- ✅ Fonctionne dans PowerShell

### Batch (Alternative)
```cmd
fix-partners-interface.bat
```

**Avantages :**
- ✅ Fonctionne dans CMD
- ✅ Simple
- ✅ Compatible tous Windows

---

## 🚀 Utilisation Rapide

### Pour Nettoyer et Redémarrer

**Option 1 : PowerShell Script**
```powershell
.\fix-partners-interface.ps1
```

**Option 2 : Commandes Manuelles**
```powershell
# Arrêter (Ctrl+C)
Remove-Item -Recurse -Force .next
npm run dev
```

**Option 3 : Batch Script**
```cmd
fix-partners-interface.bat
```

---

## 💡 Astuce

Pour savoir quel terminal vous utilisez :

```powershell
# Dans PowerShell, cette commande fonctionne :
$PSVersionTable

# Dans CMD, cette commande ne fonctionne pas
```

Si `$PSVersionTable` affiche des informations → Vous êtes dans **PowerShell**  
Si vous avez une erreur → Vous êtes dans **CMD**

---

## ✅ Commande Correcte pour Vous

Puisque vous utilisez **PowerShell**, utilisez :

```powershell
Remove-Item -Recurse -Force .next
```

**Pas :** `rmdir /s /q .next` (CMD seulement)

---

**Utilisez maintenant :** `.\fix-partners-interface.ps1` 🚀
