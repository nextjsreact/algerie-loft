# Analyse de Migration - Composant Login

## Composants concernés
- `components/auth/login-page-client.tsx`
- `components/auth/simple-login-form.tsx`

## Hook actuel
- `useSimpleTranslation()` - Hook personnalisé avec traductions hardcodées

## Clés de traduction utilisées

### Dans SimpleLoginForm
1. `auth.welcomeBack` - Titre principal "Bon retour"
2. `auth.signInDescription` - Description "Connectez-vous à votre compte"
3. `auth.signIn` - Bouton "Se connecter"
4. `auth.email` - Label "Email"
5. `auth.enterEmail` - Placeholder "Entrez votre email"
6. `auth.password` - Label "Mot de passe"
7. `auth.enterPassword` - Placeholder "Entrez votre mot de passe"
8. `auth.forgotPassword` - Lien "Mot de passe oublié ?"
9. `auth.signingIn` - État de chargement "Connexion..."
10. `auth.noAccount` - Texte "Vous n'avez pas de compte ?"
11. `auth.signUp` - Lien "S'inscrire"
12. `auth.demoAccounts` - Titre "Comptes de démonstration"
13. `auth.admin` - "Admin"
14. `auth.manager` - "Manager"
15. `auth.member` - "Membre"

## Vérification dans messages/*.json

✅ **Toutes les clés existent** dans les fichiers de traduction next-intl :
- `messages/fr.json` - ✅ Complet
- `messages/en.json` - ✅ Complet  
- `messages/ar.json` - ✅ Complet

## Plan de migration

1. **Remplacer** `useSimpleTranslation()` par `useTranslations('auth')`
2. **Adapter** la syntaxe des clés (supprimer le préfixe 'auth.')
3. **Tester** dans les 3 langues
4. **Valider** le changement de langue en temps réel

## Changements requis

### Avant (i18next/useSimpleTranslation)
```tsx
const { t } = useSimpleTranslation()
t('auth.welcomeBack')
```

### Après (next-intl)
```tsx
const t = useTranslations('auth')
t('welcomeBack')
```

## Composants dépendants
- `SimpleLanguageSelector` - Peut nécessiter une mise à jour
- Validation des formulaires - Vérifier les messages d'erreur