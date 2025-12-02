# Ajout du mot de passe WiFi dans la page des lofts

## Changements effectués

### 1. Base de données
- **Fichier SQL**: `add-wifi-password-column.sql`
- Ajout de la colonne `wifi_password` dans la table `lofts`
- Type: TEXT (mot de passe en clair pour accès invités)

### 2. Interface utilisateur
- **Fichier modifié**: `app/[locale]/lofts/[id]/page.tsx`
- Ajout d'une nouvelle carte "Internet" dans la section "Services & Utilitaires"
- Affichage du mot de passe WiFi en clair
- Design cohérent avec les autres cartes (Eau, Électricité, Gaz)

### 3. Traductions
Ajout des traductions dans les 3 langues:

**Français:**
- internet: "Internet"
- wifiPassword: "Mot de passe WiFi"

**English:**
- internet: "Internet"
- wifiPassword: "WiFi Password"

**العربية:**
- internet: "الإنترنت"
- wifiPassword: "كلمة مرور WiFi"

## Utilisation

### Pour ajouter un mot de passe WiFi à un loft:
```sql
UPDATE lofts 
SET wifi_password = 'VotreMotDePasseWiFi' 
WHERE id = 'votre-loft-id';
```

### Affichage
Le mot de passe WiFi s'affiche dans la page de détails du loft:
- Section: Services & Utilitaires
- Carte: Internet (violet/purple)
- Format: Texte en clair dans un badge

## Sécurité
⚠️ **Note**: Le mot de passe WiFi est stocké et affiché en clair pour faciliter l'accès des invités. Assurez-vous que seuls les utilisateurs autorisés (admin, manager) ont accès à cette page.

## Prochaines étapes
1. Exécuter le script SQL `add-wifi-password-column.sql` dans Supabase
2. Mettre à jour les mots de passe WiFi pour les lofts existants
3. Tester l'affichage dans les 3 langues (fr, en, ar)
