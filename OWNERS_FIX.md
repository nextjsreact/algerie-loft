# Correction: Liste des propriétaires vide

## Problème
La liste déroulante des propriétaires était vide lors de la création/édition d'un loft.

## Cause
Le formulaire cherchait le champ `owner.name` mais la table `partner_profiles` utilise `business_name`.

## Solution
✅ **Fichier modifié**: `components/forms/loft-form.tsx`
- Changé `owner.name` en `owner.business_name || owner.name`
- Cela permet la compatibilité avec les deux structures

## Vérification
La table `partner_profiles` contient actuellement **8 partenaires**:
1. Annaba Lofts (company) - verified
2. Habib Belkacemi (individual) - verified
3. Habibo Admin (individual) - rejected
4. Haboubi (individual) - verified
5. Immobilier Alger (company) - verified
6. Karim Mansouri (individual) - verified
7. Oran Properties (company) - verified
8. Tlemcen Residences (company) - pending

## Test
1. Aller sur `/lofts/new` pour créer un nouveau loft
2. La liste déroulante "Propriétaire" devrait maintenant afficher les 8 partenaires
3. Aller sur `/lofts/[id]/edit` pour éditer un loft existant
4. La liste déroulante devrait aussi fonctionner

## Note
La fonction `getOwners()` dans `app/actions/owners.ts` utilise déjà correctement `partner_profiles`, donc aucune modification n'était nécessaire côté backend.
