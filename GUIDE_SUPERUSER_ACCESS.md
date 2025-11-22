# Guide d'Accès Superuser

## Comment obtenir l'accès superuser

### Étape 1: Identifier votre email
Trouvez l'adresse email avec laquelle vous êtes connecté à l'application.

### Étape 2: Modifier le script SQL
1. Ouvrez le fichier `grant-superuser-role.sql`
2. Remplacez `'votre@email.com'` par votre adresse email réelle (2 occurrences)
3. Sauvegardez le fichier

### Étape 3: Exécuter le script dans Supabase
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `grant-superuser-role.sql`
5. Cliquez sur **Run** pour exécuter le script

### Étape 4: Vérifier l'accès
1. Déconnectez-vous de l'application
2. Reconnectez-vous avec votre compte
3. Vous devriez maintenant voir:
   - Le lien "Administration Superuser" dans la sidebar
   - Le lien "Database Cloner" dans la sidebar
   - Accès au tableau de bord superuser avec toutes les sections

## Sections du Tableau de Bord Superuser

Une fois connecté en tant que superuser, vous aurez accès à:

### 📊 Tableau de bord
- Vue d'ensemble du système
- Statistiques en temps réel
- Alertes critiques

### 👥 Gestion Utilisateurs
- Liste de tous les utilisateurs
- Modification des rôles
- Activation/Désactivation des comptes

### 🔒 Sécurité & Audit
- Logs d'audit
- Tentatives de connexion
- Actions sensibles

### 💾 Sauvegardes
- Créer des sauvegardes
- Restaurer des données
- Planifier des sauvegardes automatiques

### 🔧 Maintenance
- Nettoyage de la base de données
- Optimisation des performances
- Gestion du cache

### ⚙️ Configuration
- Paramètres système
- Variables d'environnement
- Configurations avancées

### 📈 Monitoring
- Performances du système
- Utilisation des ressources
- Métriques en temps réel

### 📦 Archives
- Données archivées
- Politiques d'archivage
- Restauration d'archives

### 🚨 Actions d'Urgence
- Verrouillage d'urgence
- Alertes critiques
- Interventions rapides

### 🗄️ Database Cloner
- Cloner des environnements
- Copier des bases de données
- Gestion des environnements de test

## Dépannage

### Le script échoue avec "Table superuser_profiles does not exist"
Vous devez d'abord déployer le système d'administration superuser:
```sql
-- Exécutez ce script dans Supabase SQL Editor
\i database/deploy-superuser-administration.sql
```

### Je ne vois toujours pas les menus superuser
1. Vérifiez que le script s'est exécuté sans erreur
2. Déconnectez-vous complètement
3. Videz le cache du navigateur (Ctrl+Shift+Delete)
4. Reconnectez-vous

### Le rôle n'est pas persistant
Vérifiez que la table `superuser_profiles` existe et contient votre entrée:
```sql
SELECT * FROM superuser_profiles WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'votre@email.com'
);
```

## Sécurité

⚠️ **Important**: Le rôle superuser donne un accès complet au système. 
- Ne partagez jamais vos identifiants superuser
- Activez l'authentification à deux facteurs (2FA)
- Surveillez régulièrement les logs d'audit
- Limitez le nombre de comptes superuser

## Support

Si vous rencontrez des problèmes, vérifiez:
1. Les logs de la console du navigateur (F12)
2. Les logs Supabase dans le SQL Editor
3. Les permissions de votre compte dans la base de données
