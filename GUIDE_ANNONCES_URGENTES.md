# 📢 Guide : Annonces Urgentes et Promotions

## 🎯 Vue d'ensemble

Le système d'annonces urgentes permet d'afficher une **bannière défilante** en haut de la page d'accueil pour :
- 🎉 Promotions spéciales
- 🚨 Annonces urgentes
- 📢 Informations importantes
- ⚡ Offres limitées dans le temps

**Comme les chaînes d'information !** Le texte défile en continu et attire l'attention.

---

## 👥 Qui peut gérer les annonces ?

Seuls les utilisateurs avec les rôles suivants peuvent créer/modifier/supprimer des annonces :
- ✅ **Admin**
- ✅ **Superuser**

---

## 🚀 Comment créer une annonce

### Étape 1 : Accéder à l'interface

1. Connectez-vous en tant qu'admin ou superuser
2. Allez sur : `/admin/announcements`
3. Cliquez sur **"Nouvelle annonce"**

### Étape 2 : Remplir le formulaire

**Champs obligatoires :**

1. **Message (Français)** 🇫🇷
   - Exemple : `🎉 Promotion spéciale : -20% sur tous les lofts ce week-end !`

2. **Message (English)** 🇬🇧
   - Exemple : `🎉 Special promotion: -20% on all lofts this weekend!`

3. **Message (العربية)** 🇸🇦
   - Exemple : `🎉 عرض خاص: خصم 20٪ على جميع الشقق هذا الأسبوع!`

4. **Durée (jours)**
   - Combien de jours l'annonce sera affichée
   - Exemple : `7` (pour une semaine)
   - Min : 1 jour, Max : 365 jours

5. **Couleur de fond**
   - Choisissez une couleur qui attire l'attention
   - Rouge (#EF4444) par défaut
   - Autres suggestions :
     - 🔴 Rouge : `#EF4444` (urgent)
     - 🟢 Vert : `#10B981` (promotion)
     - 🔵 Bleu : `#3B82F6` (info)
     - 🟡 Jaune : `#F59E0B` (attention)
     - 🟣 Violet : `#8B5CF6` (spécial)

6. **Couleur du texte**
   - Blanc (#FFFFFF) par défaut
   - Assurez-vous d'un bon contraste avec le fond

### Étape 3 : Prévisualiser

Un aperçu s'affiche en temps réel pour voir le rendu final.

### Étape 4 : Créer

Cliquez sur **"Créer l'annonce"** et elle sera immédiatement visible sur la page d'accueil !

---

## ✏️ Modifier une annonce

1. Allez sur `/admin/announcements`
2. Trouvez l'annonce à modifier
3. Cliquez sur l'icône **✏️ Modifier**
4. Modifiez les champs
5. Cliquez sur **"Mettre à jour"**

---

## 👁️ Activer/Désactiver une annonce

Pour désactiver temporairement une annonce sans la supprimer :

1. Cliquez sur l'icône **👁️ Œil**
2. L'annonce devient inactive (ne s'affiche plus)
3. Cliquez à nouveau pour la réactiver

**Utile pour :**
- Tester une annonce avant de la publier
- Mettre en pause une promotion
- Garder une annonce pour la réutiliser plus tard

---

## 🗑️ Supprimer une annonce

1. Cliquez sur l'icône **🗑️ Corbeille**
2. Confirmez la suppression
3. L'annonce est définitivement supprimée

⚠️ **Attention :** Cette action est irréversible !

---

## 📊 Statuts des annonces

| Statut | Description | Couleur |
|--------|-------------|---------|
| **Active** | Affichée sur le site | 🟢 Vert |
| **Inactive** | Désactivée manuellement | ⚪ Gris |
| **Expirée** | Date de fin dépassée | ⚪ Gris |

---

## 🎨 Conseils de design

### Messages efficaces

✅ **Bon :**
- Court et percutant
- Utilise des emojis 🎉
- Appel à l'action clair
- Exemple : `🎉 -30% ce week-end ! Réservez maintenant 🔥`

❌ **À éviter :**
- Trop long (> 100 caractères)
- Pas d'emojis (moins attractif)
- Vague : "Promotion en cours"
- Exemple : `Nous avons une promotion spéciale sur certains lofts pendant une période limitée`

### Couleurs

**Pour les promotions :**
- 🟢 Vert : Offre positive, économies
- 🔵 Bleu : Confiance, information

**Pour les urgences :**
- 🔴 Rouge : Urgent, dernière chance
- 🟡 Jaune : Attention, important

**Pour les événements spéciaux :**
- 🟣 Violet : Exclusif, premium
- 🟠 Orange : Énergie, enthousiasme

### Durée

| Type d'annonce | Durée recommandée |
|----------------|-------------------|
| Flash sale | 1-3 jours |
| Promotion week-end | 3-7 jours |
| Offre mensuelle | 30 jours |
| Annonce permanente | 90-365 jours |

---

## 📱 Affichage sur le site

### Position
La bannière s'affiche **tout en haut** de la page d'accueil, au-dessus du header.

### Animation
- Le texte **défile** de droite à gauche
- Icônes animées (📢 et ⚠️)
- Barre de progression indiquant le temps restant

### Fermeture
Les utilisateurs peuvent fermer la bannière avec le bouton **✕**.
Elle ne réapparaîtra pas pendant leur session.

---

## 🔄 Exemples d'annonces

### Promotion flash

```
FR: 🔥 Flash Sale : -50% sur les lofts à Alger ! Seulement 24h !
EN: 🔥 Flash Sale: -50% on Algiers lofts! Only 24h!
AR: 🔥 تخفيضات سريعة: خصم 50٪ على شقق الجزائر! 24 ساعة فقط!

Durée: 1 jour
Couleur fond: #EF4444 (Rouge)
Couleur texte: #FFFFFF (Blanc)
```

### Nouveau loft

```
FR: ✨ Nouveau ! Loft de luxe à Oran maintenant disponible
EN: ✨ New! Luxury loft in Oran now available
AR: ✨ جديد! شقة فاخرة في وهران متاحة الآن

Durée: 14 jours
Couleur fond: #8B5CF6 (Violet)
Couleur texte: #FFFFFF (Blanc)
```

### Offre été

```
FR: ☀️ Offre Été : Réservez 7 nuits, payez 5 ! Code: ETE2024
EN: ☀️ Summer Offer: Book 7 nights, pay 5! Code: SUMMER2024
AR: ☀️ عرض الصيف: احجز 7 ليالٍ، ادفع 5! الرمز: صيف2024

Durée: 90 jours
Couleur fond: #F59E0B (Jaune/Orange)
Couleur texte: #1F2937 (Gris foncé)
```

### Maintenance

```
FR: 🔧 Maintenance prévue le 25/12 de 2h à 4h. Merci de votre compréhension.
EN: 🔧 Scheduled maintenance on 12/25 from 2am to 4am. Thank you for your understanding.
AR: 🔧 صيانة مجدولة في 25/12 من الساعة 2 إلى 4 صباحًا. شكرا لتفهمكم.

Durée: 7 jours
Couleur fond: #3B82F6 (Bleu)
Couleur texte: #FFFFFF (Blanc)
```

---

## 🛠️ Fonctionnalités techniques

### Expiration automatique
Les annonces sont automatiquement désactivées quand leur date de fin est atteinte.

### Multilingue
Le site affiche automatiquement le message dans la langue choisie par l'utilisateur.

### Responsive
La bannière s'adapte à tous les écrans (mobile, tablette, desktop).

### Performance
- Vérification toutes les minutes pour les nouvelles annonces
- Cache localStorage pour ne pas réafficher les annonces fermées

---

## 📊 Bonnes pratiques

### ✅ À faire

- Utiliser des emojis pour attirer l'attention
- Garder le message court (< 80 caractères)
- Tester sur mobile avant de publier
- Définir une durée appropriée
- Utiliser des couleurs contrastées
- Inclure un appel à l'action

### ❌ À éviter

- Messages trop longs
- Trop d'annonces en même temps (max 1)
- Couleurs peu contrastées
- Fautes d'orthographe
- Informations obsolètes
- Durées trop longues pour des promotions

---

## 🆘 Dépannage

### L'annonce ne s'affiche pas

**Vérifiez :**
1. L'annonce est **Active** (statut vert)
2. La date de fin n'est pas dépassée
3. Vous avez bien rempli les 3 langues
4. Rechargez la page (Ctrl+Shift+R)

### Le texte est coupé

**Solution :**
- Réduisez la longueur du message
- Maximum recommandé : 80 caractères

### Les couleurs ne s'affichent pas bien

**Solution :**
- Vérifiez le contraste texte/fond
- Utilisez un outil : https://webaim.org/resources/contrastchecker/

### L'annonce réapparaît après fermeture

**Explication :**
- Normal si l'utilisateur vide son cache
- Normal si l'utilisateur change de navigateur
- C'est voulu pour ne pas manquer les annonces importantes

---

## 📚 Fichiers liés

- **Migration SQL** : `database/migrations/create_urgent_announcements.sql`
- **Composant bannière** : `components/UrgentAnnouncementBanner.tsx`
- **Interface admin** : `app/[locale]/admin/announcements/page.tsx`

---

## ✨ Résumé

1. **Accédez** à `/admin/announcements`
2. **Créez** une nouvelle annonce
3. **Remplissez** les 3 langues
4. **Choisissez** la durée et les couleurs
5. **Publiez** et c'est en ligne ! 🎉

Simple et efficace ! 😊
