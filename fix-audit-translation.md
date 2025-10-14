# Correction de la traduction "Audit" dans le menu

## Problème identifié
Dans le menu des paramètres en arabe, le mot "Audit" n'était pas traduit et s'affichait en anglais au milieu du texte arabe :
```
الإعداداتالفئاتالعملاتالمناطق الجغرافيةطرق الدفعاتصالات الإنترنتAuditالتطبيق
```

## Cause du problème
Dans les composants sidebar, le mot "Audit" était écrit en dur au lieu d'utiliser une traduction :
```typescript
{ name: 'Audit', href: `/${locale}/settings/audit`, icon: Shield, roles: ["admin", "manager"] }
```

## Solution appliquée

### 1. Correction dans les sidebars
**Fichiers modifiés :**
- `components/layout/sidebar-nextintl.tsx`
- `components/layout/enhanced-sidebar-nextintl.tsx`

**Changement :**
```typescript
// Avant
{ name: 'Audit', href: `/${locale}/settings/audit`, icon: Shield, roles: ["admin", "manager"] }

// Après
{ name: t('audit'), href: `/${locale}/settings/audit`, icon: Shield, roles: ["admin", "manager"] }
```

### 2. Ajout des traductions manquantes
**Ajouté dans `messages/ar.json` :**
```json
"audit": "التدقيق"
```

**Ajouté dans `messages/fr.json` :**
```json
"audit": "Audit"
```

**Ajouté dans `messages/en.json` :**
```json
"audit": "Audit"
```

## Résultat attendu
Le menu des paramètres en arabe devrait maintenant s'afficher correctement :
```
الإعداداتالفئاتالعملاتالمناطق الجغرافيةطرق الدفعاتصالات الإنترنتالتدقيقالتطبيق
```

Au lieu de :
```
الإعداداتالفئاتالعملاتالمناطق الجغرافيةطرق الدفعاتصالات الإنترنتAuditالتطبيق
```

## Test
Pour vérifier la correction :
1. Changer la langue vers l'arabe
2. Aller dans le menu des paramètres
3. Vérifier que "Audit" est maintenant traduit en "التدقيق"

## Impact
- ✅ Cohérence linguistique dans l'interface arabe
- ✅ Meilleure expérience utilisateur pour les utilisateurs arabophones
- ✅ Respect des standards de localisation
- ✅ Interface entièrement traduite