# 🚀 Guide Rapide : Gérer le Serveur

## ⚡ COMMANDES ESSENTIELLES

### 🟢 Démarrer le serveur

```bash
.\start-dev.bat
```

**Ou :**

```bash
node node_modules\next\dist\bin\next dev
```

---

### 🔴 Arrêter le serveur

```powershell
.\stop-dev.ps1
```

**Ou manuellement :**

```powershell
# 1. Trouver le PID
netstat -ano | findstr :3000

# 2. Arrêter (remplacer 53152 par votre PID)
taskkill /PID 53152 /F
```

---

### 🔄 Redémarrer le serveur

```bash
.\manage-server.bat
```

Puis choisir l'option 3.

---

### ✅ Vérifier le statut

```bash
.\check-server.bat
```

**Ou :**

```powershell
netstat -ano | findstr :3000
```

---

## 📋 SCRIPTS DISPONIBLES

| Script | Description | Usage |
|--------|-------------|-------|
| `start-dev.bat` | Démarre le serveur | Double-clic ou `.\start-dev.bat` |
| `stop-dev.ps1` | Arrête le serveur | `.\stop-dev.ps1` |
| `manage-server.bat` | Menu interactif | `.\manage-server.bat` |
| `check-server.bat` | Vérifie le statut | `.\check-server.bat` |

---

## ❓ POURQUOI `npm run dev` NE FONCTIONNE PAS ?

**Problème :** npm ne trouve pas le binaire `next` dans le PATH Windows.

**Solution :** Utiliser les scripts fournis ou la commande directe avec node.

**Détails complets :** Voir `GUIDE_GESTION_SERVEUR.md`

---

## 🎯 UTILISATION QUOTIDIENNE

### Matin (Démarrer)

1. Double-cliquer sur `start-dev.bat`
2. Attendre que "Ready" s'affiche
3. Ouvrir http://localhost:3000

### Soir (Arrêter)

1. Clic droit sur `stop-dev.ps1`
2. Choisir "Exécuter avec PowerShell"
3. Le serveur s'arrête automatiquement

---

## 🔧 DÉPANNAGE RAPIDE

### Port déjà utilisé ?

```powershell
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Serveur ne répond pas ?

```powershell
# Nettoyer et redémarrer
Remove-Item -Recurse -Force .next
.\start-dev.bat
```

### Tout arrêter ?

```powershell
taskkill /IM node.exe /F
```

---

## 📍 URL DU SERVEUR

```
http://localhost:3000
```

---

## ✅ CHECKLIST

- [ ] J'ai testé `.\start-dev.bat` → ✅ Fonctionne
- [ ] J'ai testé `.\stop-dev.ps1` → ✅ Fonctionne
- [ ] Je sais vérifier le statut → ✅ `netstat -ano | findstr :3000`
- [ ] Je sais pourquoi `npm run dev` ne marche pas → ✅ Problème de PATH

---

**Besoin de plus de détails ?** → Voir `GUIDE_GESTION_SERVEUR.md`

