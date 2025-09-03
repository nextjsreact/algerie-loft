# Scripts de Maintenance des Conversations

## 📋 Scripts Disponibles

### 1. **Gestion des Utilisateurs**

#### `scripts/check-user-names.mjs`
Vérifie les noms d'utilisateurs dans la base de données.
```bash
node scripts/check-user-names.mjs
```
- Affiche tous les utilisateurs avec leurs noms et rôles
- Identifie les noms génériques ("member1", etc.)
- Fournit des statistiques

#### `scripts/fix-user-names.mjs`
Corrige les noms d'utilisateurs génériques.
```bash
node scripts/fix-user-names.mjs
```
- Remplace "member1" par "Membre 1"
- Corrige "Team Member" en "Membre"
- Met à jour automatiquement la base de données

### 2. **Gestion des Conversations**

#### `scripts/check-conversations.mjs`
Vérifie les conversations et leurs participants.
```bash
node scripts/check-conversations.mjs
```
- Liste toutes les conversations
- Affiche les participants de chaque conversation
- Identifie les problèmes potentiels

#### `scripts/fix-conversation-names.mjs`
Corrige les noms des conversations directes.
```bash
node scripts/fix-conversation-names.mjs
```
- Met à jour les noms basés sur les participants actuels
- Corrige "member1, Habibo Admin" en "Habibo Admin, Membre 1"
- Trie les noms alphabétiquement

#### `scripts/clean-duplicate-conversations.mjs`
Identifie et peut supprimer les conversations en double.
```bash
node scripts/clean-duplicate-conversations.mjs
```
- Trouve les conversations avec les mêmes participants
- Propose de garder la plus ancienne
- **ATTENTION**: Décommentez le code pour exécuter la suppression

## 🔧 Utilisation Recommandée

### Maintenance Complète
Pour une maintenance complète du système de conversations :

```bash
# 1. Vérifier l'état actuel
node scripts/check-user-names.mjs
node scripts/check-conversations.mjs

# 2. Corriger les problèmes
node scripts/fix-user-names.mjs
node scripts/fix-conversation-names.mjs

# 3. Nettoyer les doublons (optionnel)
node scripts/clean-duplicate-conversations.mjs

# 4. Vérifier le résultat
node scripts/check-conversations.mjs
```

### Maintenance Régulière
Pour une maintenance régulière :

```bash
# Vérification rapide
node scripts/check-user-names.mjs

# Correction si nécessaire
node scripts/fix-user-names.mjs
```

## ⚠️ Précautions

### Sauvegarde
Toujours faire une sauvegarde avant d'exécuter les scripts de correction :
```bash
# Exporter les données importantes
pg_dump -h your-host -U your-user -d your-db -t conversations > backup_conversations.sql
pg_dump -h your-host -U your-user -d your-db -t conversation_participants > backup_participants.sql
pg_dump -h your-host -U your-user -d your-db -t profiles > backup_profiles.sql
```

### Environnement de Test
Testez toujours les scripts sur un environnement de développement avant la production.

### Variables d'Environnement
Assurez-vous que ces variables sont définies dans `.env` :
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📊 Résultats Attendus

### Avant les Corrections
- Noms d'utilisateurs : "member1", "Team Member"
- Noms de conversations : "member1, Habibo Admin"
- Conversations en double possibles

### Après les Corrections
- Noms d'utilisateurs : "Membre 1", "Membre"
- Noms de conversations : "Habibo Admin, Membre 1"
- Conversations uniques et propres

## 🐛 Dépannage

### Erreur de Permissions
Si vous obtenez des erreurs de permissions :
1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correct
2. Assurez-vous que la clé de service a les permissions nécessaires

### Erreur de Relations
Si vous obtenez des erreurs de relations :
1. Vérifiez que toutes les tables existent
2. Exécutez les migrations de base de données si nécessaire

### Données Manquantes
Si des utilisateurs ou conversations sont manquants :
1. Vérifiez les politiques RLS
2. Assurez-vous que les données n'ont pas été supprimées accidentellement

## 📝 Logs

Tous les scripts produisent des logs détaillés :
- ✅ Opérations réussies
- ❌ Erreurs rencontrées
- ⚠️ Avertissements
- 📊 Statistiques finales

Conservez ces logs pour le suivi et le débogage.