# 🚀 GUIDE CLONAGE POSTGRESQL COMPLET - DROP & RECREATE

Ce guide explique comment utiliser le système de clonage PostgreSQL complet qui utilise `pg_dump` et `pg_restore` pour un clonage complet de la structure et des données.

## ⚠️ ATTENTION IMPORTANTE

**Cette méthode supprime complètement la structure de la base de données cible !**
- Toutes les tables, vues, fonctions, index sont supprimés
- La structure complète est recréée depuis la source
- Toutes les données sont importées depuis la source

## 📋 Prérequis

### 1. PostgreSQL Client Tools
Assurez-vous d'avoir `pg_dump` et `pg_restore` installés sur votre système :
- **Windows** : Installez PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux/Mac** : Généralement pré-installé ou via `apt install postgresql-client`

### 2. Variables d'environnement
Les fichiers `.env` dans `env-backup/` doivent contenir :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Accès réseau
Le système doit pouvoir accéder aux bases Supabase via le réseau.

## 🛠️ Scripts Disponibles

### Scripts Batch Windows (Double-clic)
- `clone-pg-to-dev.bat` - Clone PROD vers DEV
- `clone-pg-to-test.bat` - Clone PROD vers TEST
- `test-pg-connection.bat` - Test de connectivité

### Script TypeScript Principal
- `clone-database-pg.ts` - Script principal avec options avancées

## 📖 Utilisation

### 1. Test de Connectivité (Recommandé)
```bash
# Test avant clonage
npx tsx scripts/clone-database-pg.ts --dry-run --verbose
```

### 2. Clonage Complet
```bash
# Clonage PROD vers DEV
npx tsx scripts/clone-database-pg.ts --source prod --target dev --verbose

# Clonage PROD vers TEST
npx tsx scripts/clone-database-pg.ts --source prod --target test --verbose

# Clonage avec mode test (simulation)
npx tsx scripts/clone-database-pg.ts --source prod --target dev --dry-run
```

### 3. Scripts Windows (Facile)
Double-cliquez sur :
- `clone-pg-to-dev.bat` pour cloner vers DEV
- `clone-pg-to-test.bat` pour cloner vers TEST
- `test-pg-connection.bat` pour tester la connectivité

## 🔧 Options Avancées

### Mode Verbeux
```bash
npx tsx scripts/clone-database-pg.ts --source prod --target dev --verbose
```
Affiche toutes les commandes exécutées.

### Mode Test (Simulation)
```bash
npx tsx scripts/clone-database-pg.ts --source prod --target dev --dry-run
```
Affiche ce qui serait fait sans rien modifier.

### Aide
```bash
npx tsx scripts/clone-database-pg.ts --help
```
Affiche toutes les options disponibles.

## 📊 Processus Détaillé

### 1. Export depuis la Source
- Utilise `pg_dump` pour exporter la structure complète
- Exporte toutes les tables, vues, fonctions, index
- Exporte toutes les données
- Format custom PostgreSQL pour efficacité

### 2. Import vers la Cible
- Utilise `pg_restore` pour importer
- Supprime (`DROP`) toutes les structures existantes
- Recrée (`CREATE`) toutes les structures
- Insère (`INSERT`) toutes les données

### 3. Nettoyage
- Supprime le fichier temporaire de dump
- Vérifie l'intégrité du clonage

## ⚡ Performance

- **Export** : Quelques secondes à quelques minutes selon la taille
- **Import** : Quelques minutes selon la taille et la complexité
- **Taille typique** : 10-50 MB pour une base moyenne

## 🚨 Sécurité et Précautions

### 1. Sauvegarde
⚠️ **TOUJOURS faire une sauvegarde avant clonage !**

### 2. Test d'abord
Utilisez `--dry-run` pour voir ce qui va être fait.

### 3. Environnements de production
- Ne jamais cloner vers PROD depuis un autre environnement
- Tester d'abord sur DEV ou TEST
- Avoir un plan de rollback

### 4. Contraintes de clés étrangères
Le système gère automatiquement l'ordre des tables pour respecter les contraintes.

## 🔍 Dépannage

### Erreur de Connectivité
```
❌ Source: ÉCHEC - [message d'erreur]
```
- Vérifiez les variables d'environnement
- Vérifiez l'accès réseau à Supabase
- Vérifiez que PostgreSQL client tools sont installés

### Erreur de Permissions
```
permission denied for schema public
```
- Vérifiez que le SERVICE_ROLE_KEY est correct
- Vérifiez les permissions Supabase

### Espace disque insuffisant
- Le fichier temporaire peut être volumineux
- Assurez-vous d'avoir assez d'espace libre

### Timeout
- Les grandes bases peuvent prendre du temps
- Augmentez les timeouts si nécessaire

## 📈 Comparaison avec l'Ancien Système

| Aspect | Ancien Système | Nouveau Système |
|--------|----------------|-----------------|
| **Structure** | UPSERT données | DROP & RECREATE |
| **Vitesse** | Rapide | Plus lent |
| **Sécurité** | Préserve données | Supprime tout |
| **Complexité** | Simple | Complexe |
| **Complétude** | Partielle | Complète |

## 🎯 Quand Utiliser

### ✅ Utilisez cette méthode si :
- Vous voulez une copie EXACTE de la structure
- Vous voulez réinitialiser complètement un environnement
- Vous voulez synchroniser la structure complète
- Vous travaillez avec des environnements de développement

### ❌ Évitez cette méthode si :
- Vous voulez préserver des données locales
- Vous travaillez sur l'environnement de production
- Vous voulez un clonage rapide
- Vous avez des contraintes de temps strictes

## 📞 Support

En cas de problème :
1. Testez la connectivité avec `--dry-run`
2. Vérifiez les logs avec `--verbose`
3. Consultez les messages d'erreur détaillés
4. Vérifiez les prérequis système

---

**⚠️ RAPPEL : Cette méthode supprime complètement la structure de la base de données cible. Utilisez avec précaution !**