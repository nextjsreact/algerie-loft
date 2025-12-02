# Mise à jour complète: Mot de passe WiFi

## Changements effectués

### 1. Affichage (Lecture)
✅ **Fichier**: `app/[locale]/lofts/[id]/page.tsx`
- Ajout d'une carte "Internet" dans la section "Services & Utilitaires"
- Affichage du mot de passe WiFi en clair
- Traductions (fr/en/ar)

### 2. Formulaire d'édition (Écriture)
✅ **Fichier**: `components/forms/loft-form.tsx`
- Ajout du champ `wifi_password` dans l'initialisation du formulaire
- Ajout d'un champ de saisie dans la section "Internet"
- Le champ est automatiquement inclus dans la soumission du formulaire
- Texte d'aide pour expliquer l'utilisation

### 3. Base de données
✅ **Fichier**: `add-wifi-password-column.sql`
- Script SQL pour ajouter la colonne `wifi_password` à la table `lofts`

### 4. Traductions
✅ Ajout dans les 3 langues (ar/en/fr):
- `wifiPassword`: Label du champ
- `wifiPasswordPlaceholder`: Placeholder du champ
- `wifiPasswordHelp`: Texte d'aide

## Fonctionnalités

### Affichage
- Le mot de passe WiFi s'affiche dans la page de détails du loft
- Visible uniquement pour les utilisateurs autorisés (admin, manager)
- Design cohérent avec les autres cartes de services

### Édition
- Champ de saisie dans le formulaire d'édition du loft
- Situé dans la section "Internet" après les champs de fréquence et échéance
- Texte d'aide pour guider l'utilisateur
- Validation automatique lors de la soumission

## Utilisation

### 1. Exécuter le script SQL
```sql
-- Dans Supabase SQL Editor
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS wifi_password TEXT;
```

### 2. Ajouter/Modifier un mot de passe WiFi
- Aller sur la page d'édition d'un loft: `/lofts/[id]/edit`
- Remplir le champ "Mot de passe WiFi" dans la section Internet
- Sauvegarder

### 3. Voir le mot de passe
- Aller sur la page de détails du loft: `/lofts/[id]`
- Le mot de passe s'affiche dans la carte "Internet"

## Sécurité
⚠️ **Note**: Le mot de passe WiFi est stocké en clair pour faciliter l'accès des invités. Assurez-vous que:
- Seuls les utilisateurs autorisés ont accès aux pages de lofts
- Les mots de passe WiFi sont différents des mots de passe administratifs
- Les mots de passe sont changés régulièrement

## Tests à effectuer
- [ ] Créer un nouveau loft avec un mot de passe WiFi
- [ ] Modifier le mot de passe WiFi d'un loft existant
- [ ] Vérifier l'affichage dans les 3 langues (fr/en/ar)
- [ ] Vérifier que le champ est optionnel (peut être vide)
