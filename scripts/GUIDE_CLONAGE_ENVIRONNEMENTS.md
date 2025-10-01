# 🚀 Guide de Clonage des Bases de Données - Système Complet

Ce guide explique comment configurer et utiliser le système de clonage de bases de données pour tous les environnements (Production, Développement, Test, Apprentissage).

## 📋 Environnements Disponibles

| Environnement | Description | Usage |
|---------------|-------------|-------|
| **prod** | Production | Source principale des données |
| **dev** | Développement | Environnement de développement local |
| **test** | Test/Staging | Environnement de test et pré-production |
| **learning** | Apprentissage | Environnement d'apprentissage et formation |

## 🛠️ Configuration Requise

### 1. Créer l'environnement Learning

Créez le fichier `.env.learning` dans le dossier `env-backup/` :

```bash
# ===========================================
# ENVIRONNEMENT D'APPRENTISSAGE/LEARNING
# ===========================================
# Généré automatiquement le 21/09/2025 13:24:00

# Base de données Supabase - Learning
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-learning.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-learning
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key-learning"

# Authentication
AUTH_SECRET=votre-auth-secret-learning-unique

# Application
NEXT_PUBLIC_APP_URL=https://learning-loft-algerie.vercel.app
NODE_ENV=learning

# Logging et Debug
NEXT_PUBLIC_DEBUG_MODE=true
LOG_LEVEL=debug

# Email (service de test - Mailtrap recommandé)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=[VOTRE_MAILTRAP_USER]
SMTP_PASS=[VOTRE_MAILTRAP_PASS]
SMTP_FROM=learning@loft-algerie.com

# Monitoring et Analytics (limités)
NEXT_PUBLIC_ANALYTICS_ENABLED=false
SENTRY_DSN=[VOTRE_LEARNING_SENTRY_DSN]

# Cache et Performance
REDIS_URL=[VOTRE_LEARNING_REDIS_URL]
ENABLE_CACHE=false

# Tests automatisés
ENABLE_E2E_TESTS=false
PLAYWRIGHT_BASE_URL=https://learning-loft-algerie.vercel.app

# Notifications temps réel
NEXT_PUBLIC_REALTIME_ENABLED=true

# Base de données
NEXT_PUBLIC_HAS_DB=true
```

### 2. Scripts de Clonage Disponibles

#### Scripts Individuels

| Script | Description | Commande |
|--------|-------------|----------|
| `clone-prod-to-dev.ts` | Clone prod → dev | `npx tsx scripts/clone-prod-to-dev.ts` |
| `clone-prod-to-test.ts` | Clone prod → test | `npx tsx scripts/clone-prod-to-test.ts` |
| `clone-prod-to-learning.ts` | Clone prod → learning | `npx tsx scripts/clone-prod-to-learning.ts` |

#### Script Universel (Recommandé)

```bash
# Clonage vers un environnement spécifique
npx tsx scripts/clone-database.ts --source prod --target dev
npx tsx scripts/clone-database.ts --source prod --target test
npx tsx scripts/clone-database.ts --source prod --target learning

# Clonage vers tous les environnements
npx tsx scripts/clone-database.ts --source prod --target all

# Mode test (simulation)
npx tsx scripts/clone-database.ts --source prod --target dev --dry-run

# Tables spécifiques uniquement
npx tsx scripts/clone-database.ts --source prod --target dev --tables lofts,transactions,profiles
```

## 📊 Script Principal : clone-database.ts

### Options Disponibles

```typescript
interface CloneOptions {
  source: 'prod' | 'test' | 'dev' | 'learning'
  target: 'prod' | 'test' | 'dev' | 'learning' | 'all'
  tables?: string[]                    // Tables spécifiques (optionnel)
  excludeSensitive?: boolean          // Exclure données sensibles (optionnel)
  dryRun?: boolean                    // Mode simulation (optionnel)
  pageSize?: number                   // Taille des lots (optionnel, défaut: 1000)
}
```

### Exemples d'Utilisation

#### 1. Clonage Complet Production → Tous Environnements
```bash
npx tsx scripts/clone-database.ts --source prod --target all
```

#### 2. Clonage Développement → Test
```bash
npx tsx scripts/clone-database.ts --source dev --target test
```

#### 3. Clonage avec Tables Spécifiques
```bash
npx tsx scripts/clone-database.ts --source prod --target learning --tables lofts,tasks,transactions
```

#### 4. Mode Test (Simulation)
```bash
npx tsx scripts/clone-database.ts --source prod --target dev --dry-run
```

## 🪟 Scripts Batch Windows (.bat)

### Scripts Prêts à l'Emploi

1. **clone-to-dev.bat** - Clone prod vers dev
2. **clone-to-test.bat** - Clone prod vers test
3. **clone-to-learning.bat** - Clone prod vers learning
4. **clone-to-all.bat** - Clone prod vers tous les environnements
5. **clone-dry-run.bat** - Test de clonage (simulation)

### Utilisation des Scripts Batch

```cmd
# Double-cliquez sur le fichier .bat ou exécutez en ligne de commande
.\scripts\clone-to-dev.bat
.\scripts\clone-to-test.bat
.\scripts\clone-to-learning.bat
.\scripts\clone-to-all.bat
```

## 🔧 Configuration Avancée

### Variables d'Environnement Requises

Chaque environnement doit avoir son fichier `.env.{environnement}` avec :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY="..."
AUTH_SECRET=...
```

### Tables Clonées par Défaut

Le système clone automatiquement ces tables :
- `currencies`, `categories`, `zone_areas`
- `internet_connection_types`, `payment_methods`
- `loft_owners`, `lofts`, `teams`, `team_members`
- `tasks`, `transactions`, `transaction_category_references`
- `settings`, `profiles`, `user_sessions`
- `notifications`, `messages`

### Anonymisation des Données

Les données sensibles sont automatiquement anonymisées :
- **Profils** : Emails transformés en `{environnement}.local`
- **Sessions** : Supprimées pour éviter les conflits
- **Notifications** : Marquées comme lues
- **Messages** : Contenu remplacé par message de test

## 📈 Workflow Recommandé

### 1. Clonage Quotidien (Production → Tous)
```bash
# Lundi au vendredi - 8h00
npx tsx scripts/clone-database.ts --source prod --target all
```

### 2. Test d'une Fonctionnalité
```bash
# 1. Clone vers test
npx tsx scripts/clone-database.ts --source prod --target test

# 2. Test de la fonctionnalité
npm run env:switch:test && npm run dev

# 3. Clone vers dev si OK
npx tsx scripts/clone-database.ts --source test --target dev
```

### 3. Formation/Apprentissage
```bash
# Clone vers learning pour formation
npx tsx scripts/clone-database.ts --source prod --target learning

# Switch vers learning
npm run env:switch:learning && npm run dev
```

## 🆘 Dépannage

### Erreur : "Fichier d'environnement introuvable"
```bash
# Vérifiez que le fichier .env.{environnement} existe
ls -la env-backup/.env.learning

# Créez le fichier avec les bonnes variables Supabase
```

### Erreur : "Variables manquantes"
```bash
# Vérifiez les variables dans le fichier .env
cat env-backup/.env.learning | grep -E "(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)"
```

### Erreur : "Table absente dans la cible"
```bash
# Le système gère automatiquement les différences de schéma
# Les tables manquantes sont ignorées avec un avertissement
```

## 📋 Commandes Rapides

```bash
# Clonage rapide vers tous les environnements
npx tsx scripts/clone-database.ts --source prod --target all

# Test rapide (simulation)
npx tsx scripts/clone-database.ts --source prod --target dev --dry-run

# Clonage vers learning uniquement
npx tsx scripts/clone-database.ts --source prod --target learning

# Vérification post-clonage
npx tsx scripts/clone-database.ts --source prod --target dev --verify
```

## 🎯 Bonnes Pratiques

1. **Sauvegardez** avant tout clonage important
2. **Testez** toujours avec `--dry-run` d'abord
3. **Vérifiez** les données après clonage
4. **Documentez** les problèmes rencontrés
5. **Utilisez** les scripts batch pour simplifier

---

**📞 Support** : Consultez les logs détaillés et les fichiers de configuration pour diagnostiquer les problèmes.

## 📝 Scripts à Créer

### 1. Script Principal Universel (clone-database.ts)

```typescript
#!/usr/bin/env tsx
/**
 * Script Universel de Clonage de Bases de Données
 * Supporte tous les environnements : prod, dev, test, learning
 *
 * Usage:
 * npx tsx scripts/clone-database.ts --source prod --target dev
 * npx tsx scripts/clone-database.ts --source prod --target all
 */

import { DataCloner } from './clone-data'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    source: { type: 'string' },
    target: { type: 'string' },
    tables: { type: 'string' },
    'dry-run': { type: 'boolean' },
    'exclude-sensitive': { type: 'boolean' },
    verify: { type: 'boolean' },
    help: { type: 'boolean' }
  },
  allowPositionals: true
})

async function main() {
  if (values.help) {
    console.log(`
🚀 CLONAGE UNIVERSEL DE BASES DE DONNÉES

Usage:
  npx tsx scripts/clone-database.ts --source <env> --target <env> [options]

Environnements:
  prod, dev, test, learning, all

Options:
  --source <env>          Environnement source (prod, dev, test, learning)
  --target <env>          Environnement cible (prod, dev, test, learning, all)
  --tables <list>         Tables spécifiques (comma-separated)
  --dry-run              Mode simulation (aucune modification)
  --exclude-sensitive    Exclure les données sensibles
  --verify               Vérifier après clonage
  --help                 Afficher cette aide

Exemples:
  npx tsx scripts/clone-database.ts --source prod --target dev
  npx tsx scripts/clone-database.ts --source prod --target all
  npx tsx scripts/clone-database.ts --source prod --target learning --dry-run
  npx tsx scripts/clone-database.ts --source prod --target test --tables lofts,tasks
    `)
    return
  }

  const { source, target, tables, 'dry-run': dryRun, 'exclude-sensitive': excludeSensitive, verify } = values

  if (!source || !target) {
    console.error('❌ Erreur: --source et --target sont requis')
    console.log('Utilisez --help pour voir les options disponibles')
    process.exit(1)
  }

  // Validation des environnements
  const validEnvs = ['prod', 'dev', 'test', 'learning', 'all']
  if (!validEnvs.includes(source) || !validEnvs.includes(target)) {
    console.error(`❌ Erreur: Environnements invalides. Utilisez: ${validEnvs.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔄 CLONAGE: ${source.toUpperCase()} → ${target.toUpperCase()}`)
  console.log('='.repeat(60))

  // Si target = all, cloner vers tous les environnements sauf prod
  if (target === 'all') {
    const targets = ['dev', 'test', 'learning']
    for (const targetEnv of targets) {
      if (source !== targetEnv) {
        console.log(`\n🎯 Clonage vers ${targetEnv.toUpperCase()}`)
        console.log('-'.repeat(40))

        const cloner = new DataCloner({
          source: source as any,
          target: targetEnv as any,
          tables: tables ? tables.split(',') : undefined,
          excludeSensitive: excludeSensitive ?? false,
          dryRun: dryRun ?? false
        })

        await cloner.cloneData()

        if (verify) {
          console.log('\n🔍 Vérification automatique...')
          await cloner.verifyClone()
        }
      }
    }
  } else {
    // Clonage simple vers un environnement spécifique
    const cloner = new DataCloner({
      source: source as any,
      target: target as any,
      tables: tables ? tables.split(',') : undefined,
      excludeSensitive: excludeSensitive ?? false,
      dryRun: dryRun ?? false
    })

    await cloner.cloneData()

    if (verify) {
      console.log('\n🔍 Vérification automatique...')
      await cloner.verifyClone()
    }
  }

  console.log('\n✅ CLONAGE TERMINÉ AVEC SUCCÈS!')
  console.log('\n💡 Prochaines étapes:')
  console.log('• Testez avec: npm run env:switch:' + (target === 'all' ? 'dev' : target))
  console.log('• Vérifiez les données avec vos scripts de vérification')
}

main().catch(console.error)
```

### 2. Script Spécialisé pour Learning (clone-prod-to-learning.ts)

```typescript
#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Learning
 * Clone les données de production vers l'environnement d'apprentissage
 */

import { DataCloner } from './clone-data'

async function cloneProdToLearning() {
  console.log('📚 CLONAGE PRODUCTION → APPRENTISSAGE')
  console.log('='.repeat(50))
  console.log('Ce script clone les données de production vers l\'environnement d\'apprentissage.')
  console.log('⚠️ Les données existantes en apprentissage seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer les données d\'apprentissage? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const cloner = new DataCloner({
    source: 'prod',
    target: 'learning',
    excludeSensitive: false, // Inclure TOUTES les données (avec anonymisation)
    dryRun: false
  })

  await cloner.cloneData()

  // Vérification automatique post-clonage
  console.log('\n🔍 Vérification automatique...')
  await cloner.verifyClone()

  console.log('\n🎓 RECOMMANDATIONS POST-CLONAGE:')
  console.log('• Testez la connexion: npm run env:switch:learning && npm run dev')
  console.log('• TOUTES les données ont été clonées avec anonymisation')
  console.log('• Mot de passe universel pour LEARNING: learn123')
  console.log('• Tous les utilisateurs peuvent se connecter avec: learn123')
  console.log('• Parfait pour la formation et les démonstrations')
}

cloneProdToLearning().catch(console.error)
```

### 3. Script pour Cloner vers Tous (clone-prod-to-all.ts)

```typescript
#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Tous les Environnements
 * Clone les données de production vers dev, test et learning simultanément
 */

import { DataCloner } from './clone-data'

async function cloneProdToAll() {
  console.log('🚀 CLONAGE PRODUCTION → TOUS LES ENVIRONNEMENTS')
  console.log('='.repeat(60))
  console.log('Ce script clone les données de production vers tous les environnements.')
  console.log('Environnements cibles: dev, test, learning')
  console.log('⚠️ Les données existantes dans tous les environnements seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer TOUTES les données? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const environments = ['dev', 'test', 'learning']

  for (const env of environments) {
    console.log(`\n🎯 Clonage vers ${env.toUpperCase()}`)
    console.log('='.repeat(40))

    const cloner = new DataCloner({
      source: 'prod',
      target: env as any,
      excludeSensitive: false,
      dryRun: false
    })

    await cloner.cloneData()

    console.log('\n🔍 Vérification automatique...')
    await cloner.verifyClone()

    console.log(`\n✅ ${env.toUpperCase()} mis à jour avec succès!`)
  }

  console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
  console.log('\n📊 Résumé:')
  console.log('• Développement: Données de prod clonées')
  console.log('• Test: Données de prod clonées')
  console.log('• Apprentissage: Données de prod clonées')
  console.log('\n💡 Testez avec: npm run env:switch:dev && npm run dev')
}

cloneProdToAll().catch(console.error)
```

### 4. Scripts Batch Windows (.bat)

#### clone-to-dev.bat
```cmd
@echo off
echo 🚀 CLONAGE PRODUCTION → DÉVELOPPEMENT
echo ===================================
npx tsx scripts/clone-prod-to-dev.ts
pause
```

#### clone-to-test.bat
```cmd
@echo off
echo 🚀 CLONAGE PRODUCTION → TEST
echo ============================
npx tsx scripts/clone-prod-to-test.ts
pause
```

#### clone-to-learning.bat
```cmd
@echo off
echo 📚 CLONAGE PRODUCTION → APPRENTISSAGE
echo ====================================
npx tsx scripts/clone-prod-to-learning.ts
pause
```

#### clone-to-all.bat
```cmd
@echo off
echo 🚀 CLONAGE PRODUCTION → TOUS
echo ============================
npx tsx scripts/clone-prod-to-all.ts
pause
```

#### clone-dry-run.bat
```cmd
@echo off
echo 🧪 TEST DE CLONAGE (SIMULATION)
echo ===============================
npx tsx scripts/clone-database.ts --source prod --target dev --dry-run
pause
```

## 🎯 Workflow Complet

### 1. Configuration Initiale
1. Créez `.env.learning` avec vos variables Supabase
2. Testez la connexion: `npm run env:switch:learning && npm run dev`

### 2. Clonage Quotidien
```bash
# Tous les matins
npx tsx scripts/clone-database.ts --source prod --target all
```

### 3. Test d'une Nouvelle Fonctionnalité
```bash
# 1. Clone vers test
npx tsx scripts/clone-database.ts --source prod --target test

# 2. Testez
npm run env:switch:test && npm run dev

# 3. Si OK, clone vers dev
npx tsx scripts/clone-database.ts --source test --target dev
```

### 4. Formation/Démonstration
```bash
# Préparez l'environnement learning
npx tsx scripts/clone-database.ts --source prod --target learning

# Démontrez avec des données fraîches
npm run env:switch:learning && npm run dev
```

## 📈 Avantages du Système

✅ **Automatisation complète** - Plus besoin de clonage manuel
✅ **Multi-environnements** - Support de 4 environnements
✅ **Sécurité** - Confirmation avant chaque opération
✅ **Anonymisation** - Données sensibles protégées
✅ **Vérification** - Contrôle automatique post-clonage
✅ **Flexibilité** - Tables spécifiques, mode test, etc.
✅ **Facilité d'usage** - Scripts batch pour Windows

Ce système vous permet de maintenir tous vos environnements synchronisés avec la production de manière simple et sécurisée !

## ⚠️ **IMPORTANT - Scripts à Créer**

**Le script `clone-database.ts` n'existe pas encore !** Vous devez le créer manuellement en copiant le code ci-dessus dans un nouveau fichier `scripts/clone-database.ts`.

### **Étapes pour créer le script :**

1. **Créez le fichier** `scripts/clone-database.ts`
2. **Copiez le code** du script principal universel ci-dessus
3. **Sauvegardez le fichier**
4. **Testez** : `npx tsx scripts/clone-database.ts --help`

### **Scripts déjà existants :**
- ✅ `scripts/clone-data.ts` - Script de base
- ✅ `scripts/clone-prod-to-dev.ts` - Prod vers dev
- ✅ `scripts/clone-prod-to-test.ts` - Prod vers test
- ❌ `scripts/clone-database.ts` - **À créer**
- ❌ `scripts/clone-prod-to-learning.ts` - **À créer**
- ❌ `scripts/clone-prod-to-all.ts` - **À créer**

### **Commandes disponibles dès maintenant :**
```bash
# Scripts existants
npx tsx scripts/clone-prod-to-dev.ts
npx tsx scripts/clone-prod-to-test.ts

# Script universel (après création)
npx tsx scripts/clone-database.ts --source prod --target all