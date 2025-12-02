# 🪟 Commandes Windows pour la Migration

## 🔧 Commandes PowerShell Correctes

### Nettoyer le Cache Next.js
```powershell
# ❌ NE PAS UTILISER (Linux/Mac)
rm -rf .next

# ✅ UTILISER (Windows PowerShell)
Remove-Item -Recurse -Force .next
```

### Autres Commandes Utiles

#### Supprimer un dossier
```powershell
Remove-Item -Recurse -Force nom_dossier
```

#### Copier un fichier
```powershell
Copy-Item source.txt destination.txt
```

#### Lister les fichiers
```powershell
Get-ChildItem
# ou simplement
dir
```

#### Chercher dans les fichiers
```powershell
Select-String -Path "*.ts" -Pattern "owners"
```

---

## 🚀 Commandes de Migration

### 1. Nettoyer et Redémarrer
```powershell
# Nettoyer le cache
Remove-Item -Recurse -Force .next

# Redémarrer l'application
npm run dev
```

### 2. Vérifier l'Intégration
```powershell
node verify-code-integration.js
```

### 3. Tester le Système
```powershell
node test-owners-system.js
```

### 4. Voir le Résumé
```powershell
node resume-migration.js
```

### 5. Menu Interactif
```powershell
.\migration-menu.bat
```

---

## 📝 Scripts Batch Disponibles

### migration-menu.bat
Menu interactif avec toutes les options:
```batch
.\migration-menu.bat
```

Options disponibles:
1. Voir le résumé complet
2. Vérifier l'état de la migration
3. Tester le système owners
4. Ajouter les politiques RLS
5. Démarrer l'application
6. Ouvrir la documentation

---

## 🎯 Workflow Complet

### Étape 1: Nettoyer
```powershell
Remove-Item -Recurse -Force .next
```

### Étape 2: Démarrer
```powershell
npm run dev
```

### Étape 3: Tester
- Ouvrir http://localhost:3000
- Tester la page d'accueil
- Tester /owners
- Tester /lofts/new

### Étape 4: Finaliser
Si tout fonctionne:
1. Ouvrir Supabase Dashboard
2. Exécuter `finalize-migration.sql`

---

## ⚠️ Erreurs Courantes

### Erreur: "rm: command not found"
**Problème:** Commande Linux utilisée sur Windows

**Solution:**
```powershell
# Au lieu de: rm -rf .next
Remove-Item -Recurse -Force .next
```

### Erreur: "Cannot find parameter 'rf'"
**Problème:** Syntaxe incorrecte pour PowerShell

**Solution:**
```powershell
# Utiliser la syntaxe PowerShell complète
Remove-Item -Recurse -Force nom_fichier
```

---

## 💡 Alias Utiles (Optionnel)

Vous pouvez créer des alias dans votre profil PowerShell:

```powershell
# Ouvrir le profil
notepad $PROFILE

# Ajouter ces lignes
function rm-rf { Remove-Item -Recurse -Force $args }
Set-Alias rr rm-rf

# Maintenant vous pouvez utiliser
rr .next
```

---

## 🔧 Commandes Rapides

```powershell
# Nettoyer et redémarrer
Remove-Item -Recurse -Force .next; npm run dev

# Vérifier et tester
node verify-code-integration.js; node test-owners-system.js

# Tout en un
.\migration-menu.bat
```

---

## ✅ Commande Actuelle

**Cache nettoyé!** ✅

**Prochaine étape:**
```powershell
npm run dev
```

Puis teste l'application!

---

*Guide Windows pour la migration - 2 Décembre 2024*
