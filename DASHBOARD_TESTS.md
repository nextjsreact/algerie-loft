# 🧪 Tests Dashboard Client - Checklist

## 📍 URLs de test

- **Dashboard principal**: `/fr/client/dashboard`
- **Page de test automatique**: `/fr/client/dashboard/test`
- **Page de démo (comparaison)**: `/fr/client/dashboard/demo`

---

## ✅ Tests à effectuer

### 1. Chargement des données réelles

- [ ] Le dashboard charge sans erreur
- [ ] Le nom de l'utilisateur s'affiche correctement
- [ ] L'avatar de l'utilisateur s'affiche (ou initiale si pas d'avatar)
- [ ] Les stats affichent les bonnes valeurs (voyages, points, favoris, note)
- [ ] Le message de chargement apparaît brièvement
- [ ] Pas d'erreur dans la console du navigateur

**Comment tester:**
1. Aller sur `/fr/client/dashboard`
2. Ouvrir la console (F12)
3. Vérifier qu'il n'y a pas d'erreurs rouges
4. Vérifier que les données s'affichent

---

### 2. Affichage des réservations

- [ ] Les réservations s'affichent dans l'onglet "À venir"
- [ ] Les réservations passées s'affichent dans l'onglet "Historique"
- [ ] Les images des lofts se chargent correctement
- [ ] Les prix sont affichés au bon format (DZD)
- [ ] Les dates sont au bon format français
- [ ] Le nombre de nuits est calculé correctement
- [ ] Le badge de statut est correct (Confirmé/En attente/Annulé)
- [ ] Le badge "Dans X jours" s'affiche pour les séjours proches

**Comment tester:**
1. Cliquer sur l'onglet "À venir"
2. Vérifier qu'il y a des réservations (ou message "Aucun séjour")
3. Cliquer sur l'onglet "Historique"
4. Vérifier les réservations passées

---

### 3. Calcul des statistiques

- [ ] Total voyages = nombre de réservations "completed"
- [ ] Points = total voyages × 200
- [ ] Favoris = 8 (valeur par défaut pour l'instant)
- [ ] Note = 4.9 (valeur par défaut pour l'instant)

**Comment tester:**
1. Compter manuellement les réservations terminées
2. Vérifier que le calcul correspond

---

### 4. Navigation entre onglets

- [ ] Clic sur "À venir" filtre correctement
- [ ] Clic sur "Historique" filtre correctement
- [ ] Clic sur "Favoris" affiche le message approprié
- [ ] L'animation de transition fonctionne
- [ ] Le compteur sur chaque onglet est correct

**Comment tester:**
1. Cliquer sur chaque onglet
2. Vérifier que le contenu change
3. Vérifier les animations

---

### 5. Responsive design

- [ ] Le dashboard s'affiche bien sur desktop (>1024px)
- [ ] Le dashboard s'affiche bien sur tablette (768-1024px)
- [ ] Le dashboard s'affiche bien sur mobile (<768px)
- [ ] Les cartes s'empilent correctement sur mobile
- [ ] Le header reste lisible sur toutes les tailles
- [ ] La barre de recherche s'adapte

**Comment tester:**
1. Ouvrir les DevTools (F12)
2. Activer le mode responsive
3. Tester différentes tailles d'écran

---

### 6. Interactions utilisateur

- [ ] Clic sur une carte de réservation redirige vers les détails
- [ ] Bouton "Rechercher" dans le header fonctionne
- [ ] Bouton "Explorer les lofts" fonctionne (si aucune réservation)
- [ ] Bouton notifications affiche le badge (3)
- [ ] Bouton paramètres est cliquable
- [ ] Carte de parrainage - bouton "Partager" copie le code
- [ ] Actions rapides redirigent vers les bonnes pages
- [ ] Destinations redirigent vers la recherche filtrée

**Comment tester:**
1. Cliquer sur chaque élément interactif
2. Vérifier la navigation
3. Vérifier les actions

---

### 7. Gestion des erreurs

- [ ] Si pas connecté → redirection vers `/fr/login`
- [ ] Si erreur API → message d'erreur affiché
- [ ] Bouton "Réessayer" fonctionne
- [ ] Si aucune réservation → message approprié affiché
- [ ] Les images manquantes ont un fallback

**Comment tester:**
1. Se déconnecter et essayer d'accéder au dashboard
2. Simuler une erreur réseau (DevTools > Network > Offline)
3. Recharger la page

---

### 8. Performance

- [ ] Le dashboard charge en moins de 3 secondes
- [ ] Les animations sont fluides (60fps)
- [ ] Pas de lag lors du scroll
- [ ] Les images se chargent progressivement
- [ ] Pas de re-render inutiles

**Comment tester:**
1. Ouvrir DevTools > Performance
2. Enregistrer le chargement de la page
3. Analyser les métriques

---

## 🔧 Tests automatiques

Accéder à `/fr/client/dashboard/test` pour lancer les tests automatiques :

1. ✅ Authentification
2. ✅ Profil utilisateur
3. ✅ API Bookings
4. ✅ Hook useDashboardData
5. ✅ Composants Dashboard
6. ✅ Contexte de connexion

---

## 🐛 Problèmes connus à vérifier

- [ ] Les favoris ne sont pas encore implémentés (affiche 8 par défaut)
- [ ] Les notes ne sont pas calculées (affiche 4.9 par défaut)
- [ ] Le système de messages n'est pas encore implémenté
- [ ] Les notifications ne sont pas encore fonctionnelles
- [ ] Les images des lofts peuvent ne pas exister dans la DB

---

## 📊 Résultats attendus

### Scénario 1: Utilisateur avec réservations
- Dashboard affiche les réservations
- Stats calculées correctement
- Navigation fluide entre onglets

### Scénario 2: Utilisateur sans réservations
- Message "Aucun séjour à venir" affiché
- Bouton "Explorer les lofts" visible
- Stats à zéro

### Scénario 3: Utilisateur non connecté
- Redirection automatique vers `/fr/login`
- Pas d'erreur affichée

---

## 🎯 Critères de validation

Pour considérer le dashboard comme **validé**, il faut :

1. ✅ Aucune erreur dans la console
2. ✅ Toutes les données réelles s'affichent
3. ✅ Navigation fonctionnelle
4. ✅ Responsive sur toutes les tailles
5. ✅ Performance acceptable (<3s de chargement)
6. ✅ Gestion des erreurs correcte

---

## 📝 Notes

- Les tests doivent être effectués avec un compte qui a des réservations
- Tester aussi avec un compte sans réservations
- Vérifier sur différents navigateurs (Chrome, Firefox, Safari)
- Tester avec et sans connexion internet

---

**Date de création**: ${new Date().toLocaleDateString('fr-FR')}
**Version**: 1.0.0
