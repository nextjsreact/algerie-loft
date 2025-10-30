# 📋 CHECKLIST DE TESTS MANUELS - SYSTÈME DE RÉSERVATION CLIENT

## 🚀 **Préparation**
- [ ] Application démarrée sur http://localhost:3000
- [ ] Base de données avec données de test créées
- [ ] Navigateur ouvert (Chrome/Firefox recommandé)

## 🏠 **1. Tests de la Page d'Accueil**

### Navigation de base
- [ ] Ouvrir http://localhost:3000
- [ ] Vérifier que la page se charge sans erreur
- [ ] Vérifier la présence du logo/titre "Loft Algerie"
- [ ] Vérifier la navigation principale (menu)
- [ ] Tester le changement de langue (FR/EN/AR)

### Formulaire de recherche
- [ ] Localiser le formulaire de recherche de lofts
- [ ] Saisir une date d'arrivée (ex: 2024-12-20)
- [ ] Saisir une date de départ (ex: 2024-12-23)
- [ ] Sélectionner le nombre d'invités (ex: 2)
- [ ] Cliquer sur "Rechercher" ou équivalent
- [ ] Vérifier que les résultats s'affichent

## 🏠 **2. Tests des Résultats de Recherche**

### Affichage des lofts
- [ ] Vérifier que les lofts disponibles s'affichent
- [ ] Chaque loft doit avoir : nom, prix, photo, description
- [ ] Tester les filtres (prix, nombre d'invités, etc.)
- [ ] Tester le tri (prix croissant/décroissant)

### Détails d'un loft
- [ ] Cliquer sur "Voir détails" d'un loft
- [ ] Vérifier l'affichage des informations complètes
- [ ] Vérifier la galerie photos (si présente)
- [ ] Vérifier les équipements/commodités
- [ ] Localiser le bouton "Réserver"

## 📅 **3. Tests du Processus de Réservation**

### Initiation de la réservation
- [ ] Cliquer sur "Réserver maintenant"
- [ ] Vérifier l'affichage du formulaire de réservation
- [ ] Vérifier que les dates sont pré-remplies

### Formulaire d'informations client
- [ ] Remplir les informations du client principal :
  - [ ] Prénom : "Jean"
  - [ ] Nom : "Dupont"
  - [ ] Email : "jean.dupont@test.com"
  - [ ] Téléphone : "+213555123456"
  - [ ] Nationalité : "Française"

### Informations sur les invités
- [ ] Vérifier le nombre d'invités
- [ ] Ajouter des invités supplémentaires si nécessaire
- [ ] Remplir les informations des invités additionnels

### Demandes spéciales
- [ ] Localiser le champ "Demandes spéciales"
- [ ] Saisir : "Arrivée tardive prévue vers 22h"
- [ ] Vérifier les options d'équipements spéciaux

### Récapitulatif et prix
- [ ] Vérifier l'affichage du récapitulatif de réservation
- [ ] Contrôler les dates (arrivée/départ)
- [ ] Vérifier le calcul du prix :
  - [ ] Prix de base (nombre de nuits × prix par nuit)
  - [ ] Frais de ménage
  - [ ] Frais de service
  - [ ] Taxes
  - [ ] Total final

### Conditions générales
- [ ] Localiser les conditions générales
- [ ] Cocher la case d'acceptation
- [ ] Vérifier que le bouton "Continuer" s'active

## 💳 **4. Tests du Processus de Paiement**

### Page de paiement
- [ ] Cliquer sur "Procéder au paiement"
- [ ] Vérifier l'affichage de la page de paiement
- [ ] Vérifier le récapitulatif de commande

### Informations de paiement (Test)
- [ ] Sélectionner le mode de paiement
- [ ] Remplir les informations de carte (si applicable) :
  - [ ] Numéro : 4242424242424242 (test Stripe)
  - [ ] Date d'expiration : 12/25
  - [ ] CVC : 123
  - [ ] Nom : Jean Dupont

### Finalisation
- [ ] Cliquer sur "Finaliser le paiement"
- [ ] Vérifier le traitement (loader/spinner)
- [ ] Attendre la redirection

## ✅ **5. Tests de Confirmation**

### Page de confirmation
- [ ] Vérifier l'affichage de la page de confirmation
- [ ] Contrôler la présence du message de succès
- [ ] Vérifier le code de confirmation (format : 8 caractères)
- [ ] Vérifier la référence de réservation (format : LA + année + numéros)

### Détails de la réservation confirmée
- [ ] Vérifier toutes les informations :
  - [ ] Nom du loft
  - [ ] Dates de séjour
  - [ ] Informations client
  - [ ] Prix total payé
  - [ ] Statut : "Confirmée"

### Communications
- [ ] Vérifier l'envoi d'email de confirmation (si configuré)
- [ ] Vérifier les instructions de check-in

## 📱 **6. Tests Responsive (Mobile)**

### Navigation mobile
- [ ] Ouvrir sur mobile ou réduire la fenêtre (375px)
- [ ] Vérifier que le menu devient hamburger
- [ ] Tester l'ouverture/fermeture du menu mobile
- [ ] Vérifier que tous les éléments sont accessibles

### Formulaires sur mobile
- [ ] Tester le formulaire de recherche sur mobile
- [ ] Vérifier que les champs sont facilement cliquables
- [ ] Tester le processus de réservation complet sur mobile
- [ ] Vérifier que les boutons sont assez grands

## 🔍 **7. Tests d'Erreurs et Cas Limites**

### Validation des formulaires
- [ ] Essayer de soumettre sans remplir les champs obligatoires
- [ ] Saisir un email invalide (ex: "email-invalide")
- [ ] Saisir des dates dans le passé
- [ ] Saisir une date de départ avant l'arrivée
- [ ] Vérifier l'affichage des messages d'erreur

### Gestion des erreurs réseau
- [ ] Couper la connexion internet temporairement
- [ ] Essayer de faire une réservation
- [ ] Vérifier l'affichage du message d'erreur réseau
- [ ] Rétablir la connexion et réessayer

### Cas de non-disponibilité
- [ ] Essayer de réserver des dates déjà occupées
- [ ] Vérifier le message d'indisponibilité
- [ ] Proposer des dates alternatives

## 🎨 **8. Tests d'Interface et UX**

### Design et cohérence
- [ ] Vérifier la cohérence des couleurs
- [ ] Vérifier la lisibilité des textes
- [ ] Vérifier l'alignement des éléments
- [ ] Tester les animations/transitions

### Performance
- [ ] Mesurer le temps de chargement initial
- [ ] Vérifier la fluidité de navigation
- [ ] Tester avec une connexion lente (throttling)

### Accessibilité de base
- [ ] Naviguer avec la touche Tab
- [ ] Vérifier que tous les éléments sont focusables
- [ ] Tester avec un lecteur d'écran (si possible)

## 📊 **9. Vérification en Base de Données**

### Après une réservation réussie
- [ ] Ouvrir l'interface Supabase ou un client SQL
- [ ] Vérifier que la réservation est créée dans la table `reservations`
- [ ] Contrôler que toutes les données sont correctes
- [ ] Vérifier le statut de la réservation
- [ ] Contrôler les logs d'audit (si configurés)

## 🚨 **Problèmes à Signaler**

### Erreurs critiques
- [ ] Page blanche ou erreur 500
- [ ] Impossible de finaliser une réservation
- [ ] Données perdues lors de la navigation
- [ ] Paiement accepté mais réservation non créée

### Problèmes d'UX
- [ ] Navigation confuse
- [ ] Messages d'erreur peu clairs
- [ ] Processus trop long ou compliqué
- [ ] Éléments non responsive

### Bugs visuels
- [ ] Éléments mal alignés
- [ ] Textes coupés ou illisibles
- [ ] Images qui ne se chargent pas
- [ ] Couleurs/contrastes problématiques

---

## 📝 **Rapport de Test**

Après avoir terminé tous les tests, documenter :

1. **Tests réussis** : Fonctionnalités qui marchent parfaitement
2. **Problèmes mineurs** : Bugs d'affichage, améliorations UX
3. **Problèmes majeurs** : Fonctionnalités cassées, erreurs critiques
4. **Suggestions d'amélioration** : Idées pour optimiser l'expérience

---

**⏱️ Temps estimé pour tous les tests : 2-3 heures**
**👥 Recommandé : Tester avec plusieurs personnes pour différents points de vue**