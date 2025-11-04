# Guide: Changer les mots de passe des employés dans Supabase

## Méthode 1: Via Supabase Dashboard (Interface graphique)

### Étapes:
1. **Connecte-toi à Supabase Dashboard**
   - Va sur https://supabase.com/dashboard
   - Sélectionne ton projet

2. **Accède à la section Authentication**
   - Dans le menu latéral, clique sur "Authentication"
   - Puis sur "Users"

3. **Trouve l'utilisateur**
   - Cherche l'employé par email dans la liste
   - Clique sur l'utilisateur

4. **Réinitialise le mot de passe**
   - Clique sur "Reset Password"
   - Ou utilise "Send Magic Link"
   - L'utilisateur recevra un email pour changer son mot de passe

## Méthode 2: Via SQL (Pour administrateurs)

### Script SQL pour forcer un nouveau mot de passe:
```sql
-- ATTENTION: Utilise cette méthode avec précaution
-- Remplace 'user-email@example.com' par l'email de l'employé
-- Remplace 'nouveau-mot-de-passe' par le nouveau mot de passe

-- 1. Trouver l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'user-email@example.com';

-- 2. Mettre à jour le mot de passe (nécessite des privilèges admin)
UPDATE auth.users 
SET encrypted_password = crypt('nouveau-mot-de-passe', gen_salt('bf'))
WHERE email = 'user-email@example.com';

-- 3. Optionnel: Forcer la confirmation d'email si nécessaire
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user-email@example.com';
```

## Méthode 3: Via l'API Supabase (Programmation)

### Script pour réinitialiser via l'API:
```javascript
// Utilise la clé service role (côté serveur uniquement)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Clé service role
)

// Réinitialiser le mot de passe d'un utilisateur
async function resetUserPassword(email, newPassword) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId, // ID de l'utilisateur
    { password: newPassword }
  )
  
  if (error) {
    console.error('Erreur:', error)
  } else {
    console.log('Mot de passe mis à jour:', data)
  }
}
```

## Méthode 4: Envoi d'email de réinitialisation

### Via l'application (Recommandé pour les utilisateurs):
```javascript
// Dans ton application
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Envoyer un email de réinitialisation
async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://ton-app.com/reset-password'
  })
  
  if (error) {
    console.error('Erreur:', error)
  } else {
    console.log('Email de réinitialisation envoyé')
  }
}
```

## ⚠️ Sécurité et Bonnes Pratiques

### À faire:
- ✅ Utilise la méthode Dashboard pour la simplicité
- ✅ Utilise l'envoi d'email pour que l'utilisateur choisisse son mot de passe
- ✅ Assure-toi que les nouveaux mots de passe sont forts
- ✅ Informe l'employé du changement

### À éviter:
- ❌ Ne partage jamais les mots de passe en texte clair
- ❌ N'utilise pas de mots de passe faibles
- ❌ Ne modifie pas directement la base de données sans sauvegarde

## Script SQL Pratique pour Administrateurs

```sql
-- Lister tous les employés
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Forcer la confirmation d'email pour un utilisateur
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'employee@example.com';

-- Voir les tentatives de connexion récentes
SELECT email, created_at, last_sign_in_at
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY last_sign_in_at DESC;
```

## Recommandation

**Pour la sécurité et la simplicité, utilise la Méthode 1 (Supabase Dashboard)** ou crée une fonctionnalité dans ton application pour que les administrateurs puissent envoyer des emails de réinitialisation aux employés.