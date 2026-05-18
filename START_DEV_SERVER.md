# 🚀 Démarrage du Serveur de Développement

## ❌ Problème Rencontré

Le serveur Next.js ne démarre pas avec `npm run dev` à cause d'un problème de PATH npm.

**Erreur:** "Le chemin d'accès spécifié est introuvable"

---

## ✅ Solutions

### Solution 1: Démarrer Manuellement (RECOMMANDÉ)

**Ouvrez un nouveau terminal PowerShell dans VS Code :**

1. Dans VS Code, appuyez sur `` Ctrl + ` `` (backtick) pour ouvrir le terminal
2. Ou allez dans **Terminal** → **New Terminal**
3. Exécutez :

```powershell
npm run dev
```

**Si ça ne fonctionne pas, essayez :**

```powershell
npx next dev
```

**Ou directement avec Node.js :**

```powershell
node node_modules\next\dist\bin\next dev
```

---

### Solution 2: Nettoyer le Cache npm

```powershell
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Réinstaller les dépendances
npm install

# Démarrer le serveur
npm run dev
```

---

### Solution 3: Vérifier la Configuration npm

```powershell
# Vérifier la configuration npm
npm config list

# Réinitialiser la configuration si nécessaire
npm config delete prefix
npm config delete cache

# Redémarrer
npm run dev
```

---

### Solution 4: Utiliser le Terminal Intégré de VS Code

1. Fermer tous les terminaux
2. Redémarrer VS Code
3. Ouvrir un nouveau terminal (`` Ctrl + ` ``)
4. Exécuter `npm run dev`

---

## 🧪 Une Fois le Serveur Démarré

Vous devriez voir :

```
> loft-algerie@2.0.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 3.2s
```

**Ensuite, ouvrez votre navigateur :**

```
http://localhost:3000/fr/admin/airbnb/import
```

---

## 📋 Tests à Effectuer

Une fois le serveur démarré :

1. **Accéder à l'interface admin**
   ```
   http://localhost:3000/fr/admin/airbnb/import
   ```

2. **Uploader le fichier de test**
   ```
   test-data/reservations_test.json
   ```

3. **Suivre le guide de test**
   ```
   Lire: TEST_ADMIN_INTERFACE.md
   ```

---

## 🆘 Si Rien ne Fonctionne

### Option Alternative: Tester l'API Directement

Si le serveur ne démarre toujours pas, vous pouvez tester l'API directement avec curl ou PowerShell :

```powershell
# Tester l'API endpoint
$body = Get-Content test-data\reservations_test.json -Raw
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:AIRBNB_API_SECRET"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/airbnb/sync" `
    -Method POST `
    -Body $body `
    -Headers $headers
```

---

## 💡 Astuce

Le problème vient probablement d'une configuration npm corrompue. La solution la plus rapide est généralement de :

1. Fermer VS Code
2. Ouvrir un nouveau PowerShell **en tant qu'administrateur**
3. Naviguer vers le projet : `cd C:\Users\SERVICE-INFO\IA\algerie-loft`
4. Exécuter : `npm run dev`

---

**Créé le:** 2026-05-18  
**Problème:** npm PATH configuration issue
