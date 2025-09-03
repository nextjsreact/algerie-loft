# ⚡ Commandes Rapides pour Kiro

## 🎯 À copier-coller dans une nouvelle session

### **Diagnostic Rapide**
```bash
# Vérification complète du composant lofts
node verify-lofts-component.cjs

# Test spécifique des traductions
node test-lofts-translations-fix.cjs
```

### **Recherche d'Erreurs**
```bash
# Trouver les références incorrectes de traduction
grep -r "t('lofts\." app/ components/

# Rechercher les erreurs dans les logs (si disponibles)
grep -r "missingKey" .
```

### **Sauvegarde**
```bash
# Créer une sauvegarde avant modifications
node backup-working-translations.cjs backup

# Lister les sauvegardes disponibles
node backup-working-translations.cjs list
```

### **Après Corrections**
```bash
# Vérifier que tout fonctionne
node verify-lofts-component.cjs

# Tester l'application
npm run dev
```

## 📋 Checklist de Résolution

- [ ] Lancer `node verify-lofts-component.cjs`
- [ ] Identifier les erreurs dans les logs du navigateur
- [ ] Créer une sauvegarde avec `node backup-working-translations.cjs backup`
- [ ] Corriger les références de traduction incorrectes
- [ ] Vérifier avec `node verify-lofts-component.cjs`
- [ ] Tester avec `npm run dev`
- [ ] Créer une nouvelle sauvegarde si tout fonctionne

## 🔧 Corrections Courantes

### **Syntaxe i18next**
```typescript
// Remplacer
t('lofts.key')
// Par
t('key', { ns: 'lofts' })
// Ou
const { t } = useTranslation('lofts'); t('key')
```

### **Références de namespace**
```typescript
// Remplacer
'descriptions.heavenLoft'
// Par  
'lofts:descriptions.heavenLoft'
```

---

**Instructions :** Copiez ce fichier dans le chat d'une nouvelle session avec Kiro pour qu'il puisse rapidement diagnostiquer et corriger les problèmes de traduction selon la méthodologie établie.