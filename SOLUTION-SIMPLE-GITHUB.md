# Solution Simple: Un Token par Projet

## Problème
Vous avez plusieurs projets avec différents comptes GitHub:
- `algerie-loft` → compte `nextjsreact`
- Autre projet → compte `tigdittgolf`
- Autre projet → compte `Habibmosta`

Git mélange les credentials entre les projets.

## Solution Simple: Token dans l'URL du Remote

### Étape 1: Créer un Personal Access Token pour ce projet

1. Connectez-vous sur GitHub avec le compte **nextjsreact**
2. Allez sur: https://github.com/settings/tokens
3. Cliquez sur "Generate new token" → "Generate new token (classic)"
4. Donnez un nom: `algerie-loft-token`
5. Cochez: `repo` (accès complet aux repositories)
6. Cliquez sur "Generate token"
7. **COPIEZ LE TOKEN** (vous ne le reverrez plus!)

### Étape 2: Configurer ce projet avec le token

```bash
# Remplacez YOUR_TOKEN par le token que vous avez copié
git remote set-url origin https://YOUR_TOKEN@github.com/nextjsreact/algerie-loft.git
```

### Étape 3: Testez
```bash
git push
```

✅ Ça marche! Plus besoin de s'authentifier pour ce projet!

## Pour vos autres projets

### Projet avec tigdittgolf:
1. Créez un token sur le compte `tigdittgolf`
2. Dans ce projet:
```bash
git remote set-url origin https://TIGDITTGOLF_TOKEN@github.com/tigdittgolf/nom-repo.git
```

### Projet avec Habibmosta:
1. Créez un token sur le compte `Habibmosta`
2. Dans ce projet:
```bash
git remote set-url origin https://HABIBMOSTA_TOKEN@github.com/Habibmosta/nom-repo.git
```

## Avantages
✅ Chaque projet a son propre token
✅ Pas de conflit entre les comptes
✅ Configuration permanente
✅ Pas besoin de SSH
✅ Fonctionne immédiatement

## Sécurité
⚠️ Le token est stocké en clair dans `.git/config`
⚠️ Ne partagez jamais votre dossier `.git`
✅ Le token est limité à ce repository
✅ Vous pouvez révoquer le token à tout moment

## Alternative: Git Credential Manager par Repository

Si vous ne voulez pas mettre le token dans l'URL, vous pouvez utiliser:

```bash
# Pour ce projet uniquement
git config credential.https://github.com.username nextjsreact
git config credential.helper store
```

Puis au premier push, entrez:
- Username: `nextjsreact`
- Password: `YOUR_TOKEN`

Le token sera stocké dans `.git/config` de ce projet uniquement.
