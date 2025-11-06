# Guide de correction des textes en dur

## Fichiers prioritaires à corriger:

### app\[locale]\lofts\[id]\page.tsx (12 problèmes)
### components\homepage\sections\LoftCard.tsx (3 problèmes)
### components\homepage\sections\PropertyEvaluationForm.tsx (3 problèmes)
### components\public\TestimonialsSection.tsx (2 problèmes)
### components\audit\audit-log-item.tsx (1 problèmes)

## Corrections suggérées:

- "Disponible" (10x) → t("available")
- "Description" (5x) → t("description")
- "الهاتف" (5x) → t("phone")
- "Propriétaire" (4x) → t("owner")
- "Type de propriété" (3x) → t("propertyType")
- "معلومات إضافية" (2x) → t("appropriateKey")
- "معرض الصور" (1x) → t("appropriateKey")
- "تم الإنشاء في" (1x) → t("appropriateKey")
- "آخر تحديث" (1x) → t("appropriateKey")
- "إدارة الفواتير" (1x) → t("appropriateKey")
- "المياه" (1x) → t("water")
- "الكهرباء" (1x) → t("electricity")
- "الغاز" (1x) → t("gas")
- "الإنترنت" (1x) → t("appropriateKey")
- "غير محدد" (1x) → t("appropriateKey")
- "الفواتير القادمة" (1x) → t("appropriateKey")

## Instructions détaillées:

1. **Ouvrir le fichier** dans votre éditeur
2. **Aller à la ligne** indiquée dans le rapport
3. **Remplacer le texte en dur** par l'appel de traduction
4. **Ajouter useTranslations()** au début du composant si nécessaire
5. **Tester** que la traduction fonctionne

## Exemple de correction:

```tsx
// AVANT
const status = "Disponible";

// APRÈS  
const t = useTranslations('common');
const status = t('available');
```
