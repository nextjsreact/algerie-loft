# 🚨 DÉPANNAGE RAPIDE - Problème PostgreSQL

## 🔍 **Problème Identifié**

L'erreur `authentification par mot de passe échouée pour l'utilisateur "IT"` indique que PostgreSQL utilise un utilisateur différent de celui attendu.

## 💡 **Solutions Immédiates**

### **Solution 1 : Correction Automatique (Recommandée)** ⭐

```bash
# Double-cliquez sur
fix-postgresql-auth.bat
```

**Ce script va :**
- ✅ Diagnostiquer automatiquement le problème
- ✅ Appliquer les corrections appropriées
- ✅ Tester les corrections
- ✅ Redémarrer PostgreSQL si nécessaire

### **Solution 2 : Diagnostic Détaillé**

```bash
# Double-cliquez sur
diagnose-postgresql.bat
```

**Ce script va :**
- ✅ Analyser votre configuration PostgreSQL
- ✅ Identifier le problème exact
- ✅ Proposer des solutions spécifiques

### **Solution 3 : Correction Manuelle Rapide**

#### **Étape 1 : Redémarrer PostgreSQL**
1. `Win + R` → tapez `services.msc`
2. Trouvez `postgresql-x64-15`
3. Clic droit → Redémarrer

#### **Étape 2 : Modifier la Configuration**
1. Ouvrez le fichier : `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
2. Trouvez les lignes avec `local` et `postgres`
3. Changez `md5` par `trust`
4. Sauvegardez et redémarrez PostgreSQL

#### **Étape 3 : Tester**
```bash
psql -U postgres -d postgres -c "SELECT 1"
```

## 🚀 **Plan d'Action Recommandé**

### **1. Essayez d'abord la correction automatique :**
```bash
fix-postgresql-auth.bat
```

### **2. Si ça ne marche pas, diagnostic détaillé :**
```bash
diagnose-postgresql.bat
```

### **3. Une fois PostgreSQL corrigé :**
```bash
setup-local-databases.bat
```

## ⚠️ **Si rien ne fonctionne :**

### **Option A : Réinstallation Propre**
1. Désinstallez PostgreSQL complètement
2. Réinstallez depuis [postgresql.org](https://www.postgresql.org/download/windows/)
3. Utilisez le mot de passe défini lors de l'installation

### **Option B : Utiliser Docker**
```bash
# Créez un fichier docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: LoftAlgerie2025!
    ports:
      - "5432:5432"

# Lancez avec
docker-compose up -d
```

## 📞 **Aide Supplémentaire**

**Scripts disponibles :**
- ✅ `fix-postgresql-auth.bat` - Correction automatique
- ✅ `diagnose-postgresql.bat` - Diagnostic détaillé
- ✅ `setup-local-databases.bat` - Configuration des bases
- ✅ `diagnose-connections.bat` - Test des connexions

**Guides complets :**
- 📖 `GUIDE_DEPANNAGE_SUPABASE.md` - Guide complet Supabase
- 📖 `GUIDE_DEPANNAGE_RAPIDE.md` - Ce guide rapide

## 🎯 **Résultat Attendu**

Après correction, vous devriez pouvoir :
- ✅ Vous connecter à PostgreSQL sans mot de passe
- ✅ Créer les bases de données locales
- ✅ Configurer tous les environnements
- ✅ Procéder au clonage des données

**La solution automatique devrait résoudre votre problème en quelques minutes !** 🚀