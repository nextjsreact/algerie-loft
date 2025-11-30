# 🌍 Intégration i18n pour le Backup

## 📝 Traductions Créées

Le fichier `BACKUP_TRANSLATIONS.json` contient toutes les traductions en :
- 🇫🇷 Français
- 🇬🇧 Anglais  
- 🇸🇦 Arabe

## 🔧 Intégration

### Option 1 : Copier-Coller dans messages/*.json (Recommandé)

1. **Ouvrir** `BACKUP_TRANSLATIONS.json`
2. **Copier** la section `"backup": { ... }` pour chaque langue
3. **Coller** dans `messages/fr.json`, `messages/en.json`, `messages/ar.json`
4. **Placer** dans la section `"superuser": { ... }`

#### Exemple pour messages/fr.json :
```json
{
  "superuser": {
    "navigation": { ... },
    "dashboard": { ... },
    "backup": {
      "title": "Gestion des Sauvegardes",
      "subtitle": "Système de sauvegarde automatique et manuelle des données",
      ...
    }
  }
}
```

### Option 2 : Modifier le Composant (Temporaire)

En attendant l'intégration dans les fichiers JSON, le composant peut utiliser un dictionnaire local.

## 📍 Emplacements dans messages/*.json

### messages/fr.json
Ligne ~3064, dans la section `"superuser": {`

### messages/en.json  
Ligne ~3280, dans la section `"superuser": {`

### messages/ar.json
Ligne ~3091, dans la section `"superuser": {`

## 🧪 Test

Après intégration :

1. **Français** : `http://localhost:3000/fr/admin/superuser/backup`
2. **Anglais** : `http://localhost:3000/en/admin/superuser/backup`
3. **Arabe** : `http://localhost:3000/ar/admin/superuser/backup`

## 📦 Utilisation dans le Composant

```typescript
import { useTranslations } from 'next-intl';

export function BackupManager() {
  const t = useTranslations('superuser.backup');
  
  return (
    <h1>{t('title')}</h1>
    <p>{t('subtitle')}</p>
    <Button>{t('actions.fullBackup')}</Button>
  );
}
```

## 🎯 Prochaines Étapes

1. Copier les traductions de `BACKUP_TRANSLATIONS.json`
2. Les coller dans `messages/fr.json`, `messages/en.json`, `messages/ar.json`
3. Modifier `components/admin/superuser/backup-manager.tsx` pour utiliser `useTranslations`
4. Tester dans les 3 langues

Voulez-vous que je modifie le composant pour utiliser les traductions ?
