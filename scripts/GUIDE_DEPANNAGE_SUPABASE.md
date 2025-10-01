# 🚨 GUIDE DE DÉPANNAGE - Problème de Connectivité Supabase

## 🔍 **Problème Identifié**

Le diagnostic révèle que **tous les environnements utilisent la même configuration Supabase obsolète** (`mhngbluefyucoesgcjoy.supabase.co`) qui n'est plus accessible.

## 💡 **Solutions Disponibles**

### **Option 1 : Créer de Nouvelles Bases Supabase (Production)**

#### **Étape 1 : Créer un Nouveau Projet Supabase**
1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte si nécessaire
3. Cliquez sur "New Project"
4. Choisissez un nom (ex: `loft-algerie-prod`)
5. Notez l'URL du projet et la clé API

#### **Étape 2 : Mettre à Jour les Configurations**
Modifiez `env-backup/.env.prod` :
```bash
# Remplacez cette ligne :
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co

# Par votre nouvelle URL :
NEXT_PUBLIC_SUPABASE_URL=https://votre-nouveau-projet.supabase.co
```

### **Option 2 : Configurer des Bases Locales (Développement)** ⭐ **RECOMMANDÉ**

#### **Étape 1 : Installer PostgreSQL**
**Windows :**
1. Téléchargez depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Installez avec les options par défaut
3. Notez le mot de passe défini lors de l'installation

**Linux/Ubuntu :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### **Étape 2 : Créer les Bases de Données**
```bash
# Créer les bases pour chaque environnement
createdb loft_prod
createdb loft_dev
createdb loft_test
createdb loft_learning
```

#### **Étape 3 : Mettre à Jour les Configurations**
Modifiez chaque fichier `.env` :

**`env-backup/.env.prod` :**
```bash
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/loft_prod"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

**`env-backup/.env.development` :**
```bash
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/loft_dev"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

**`env-backup/.env.test` :**
```bash
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/loft_test"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

**`env-backup/.env.learning` :**
```bash
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/loft_learning"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

### **Option 3 : Utiliser Docker (Alternative Simple)**

#### **Étape 1 : Créer docker-compose.yml**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: loft_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### **Étape 2 : Lancer PostgreSQL**
```bash
docker-compose up -d
```

## 🧪 **Tester la Configuration**

### **1. Test de Connectivité**
```bash
# Double-clic sur Windows
diagnose-connections.bat

# Ou ligne de commande
npx tsx scripts/diagnose-connections.ts
```

### **2. Test Manuel**
```bash
# Test de connexion à PostgreSQL
psql "postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/loft_prod" -c "SELECT 1"
```

## 🚀 **Utilisation Après Configuration**

### **Une fois les connexions établies :**

#### **Clonage Complet (DROP & RECREATE)**
```bash
# Double-clic sur Windows
clone-pg-to-dev.bat

# Ou ligne de commande
npx tsx scripts/clone-database-pg.ts --source prod --target dev --verbose
```

#### **Mode Test (Simulation)**
```bash
npx tsx scripts/clone-database-pg.ts --source prod --target dev --dry-run
```

## ⚠️ **Points Importants**

### **Sécurité**
- ✅ Utilisez des mots de passe forts
- ✅ Ne commitez jamais les fichiers `.env` dans Git
- ✅ Utilisez des environnements séparés pour chaque usage

### **Performance**
- ✅ Les bases locales sont plus rapides
- ✅ Pas de limite de bande passante
- ✅ Contrôle total des données

### **Sauvegarde**
- ✅ Sauvegardez régulièrement vos bases locales
- ✅ Exportez les données avant les clonages
- ✅ Testez les restaurations

## 📞 **Support et Aide**

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : `npx tsx scripts/clone-database-pg.ts --verbose`
2. **Testez la connectivité** : `diagnose-connections.bat`
3. **Vérifiez les permissions** PostgreSQL
4. **Assurez-vous** que PostgreSQL est démarré

## 🎯 **Recommandation Finale**

**Pour un usage immédiat**, utilisez **l'Option 2 (bases locales)** car elle est :
- ✅ Plus rapide à configurer
- ✅ Plus fiable
- ✅ Parfaite pour le développement
- ✅ Sans dépendance internet

**Les bases locales sont idéales pour le développement et les tests !** 🚀