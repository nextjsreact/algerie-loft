# Implementation Plan

- [x] 1. Ajouter les nouvelles traductions pour les types de blocage

  - Étendre le fichier `lib/reservations-translations.ts` avec les nouvelles clés de traduction
  - Ajouter les traductions pour 'maintenance', 'renovation', 'blocked', et 'other' dans les trois langues (fr, en, ar)
  - Créer une fonction utilitaire pour mapper les raisons de blocage aux clés de traduction
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Créer les fonctions utilitaires pour le formatage des événements

  - Implémenter `formatBlockedEventTitle()` pour formater les titres avec nom du loft
  - Implémenter `getBlockedReasonKey()` pour mapper les raisons aux clés de traduction
  - Implémenter `getSafeEventTitle()` avec gestion des cas d'erreur et fallbacks
  - Ajouter des tests unitaires pour ces fonctions utilitaires
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3_

- [x] 3. Mettre à jour l'interface CalendarEvent et les types

  - Ajouter le champ optionnel `loftName` à l'interface `CalendarEvent`

  - Mettre à jour l'interface `AvailabilityResource` pour inclure `loft_name`
  - Ajouter les types TypeScript pour les nouvelles fonctions utilitaires
  - _Requirements: 1.1, 1.2_

- [x] 4. Modifier la logique de création des événements dans ReservationCalendar

  - Mettre à jour la fonction `fetchAvailability()` pour extraire le nom du loft des données API
  - Modifier la création des `availabilityEvents` pour utiliser les nouvelles fonctions de formatage
  - Intégrer le nom du loft dans le titre des événements bloqués
  - Tester que les événements affichent correctement le nom du loft
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Améliorer les styles CSS pour les différents types de blocage

  - Ajouter les classes CSS pour `.rbc-event-maintenance`, `.rbc-event-renovation`, `.rbc-event-blocked`
  - Implémenter des couleurs distinctes pour chaque type de blocage
  - Améliorer la lisibilité du texte dans les cellules avec `.rbc-event-content`
  - Tester l'affichage visuel des différents types d'événements
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Mettre à jour la fonction eventStyleGetter pour les nouveaux types

  - Modifier `eventStyleGetter()` pour gérer les nouveaux types de blocage (maintenance, renovation)
  - Appliquer les styles appropriés selon le type de blocage
  - Assurer la cohérence visuelle avec la légende existante
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Améliorer la gestion des cellules pour la lisibilité

  - Ajuster les styles CSS pour augmenter la hauteur des cellules si nécessaire
  - Implémenter la troncature intelligente du texte avec ellipsis
  - Assurer que le texte reste lisible sur toutes les tailles d'écran
  - Tester la responsivité sur mobile et desktop
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Ajouter un système de tooltip pour les informations complètes

  - Créer un composant `EventTooltip` pour afficher les détails complets
  - Intégrer le tooltip avec les événements du calendrier
  - Afficher le nom du loft, la raison du blocage et les détails dans le tooltip
  - Tester l'affichage du tooltip sur hover et touch
  - _Requirements: 1.4, 2.3_

- [x] 9. Mettre à jour la légende du calendrier

  - Ajouter les nouveaux types de blocage à la légende existante
  - Utiliser les traductions appropriées pour chaque type
  - Assurer la cohérence des couleurs entre la légende et les événements
  - Tester l'affichage multilingue de la légende
  - _Requirements: 4.4, 3.1, 3.2, 3.3_

- [x] 10. Implémenter la gestion d'erreur robuste

  - Ajouter la validation des données reçues de l'API availability
  - Implémenter les fallbacks pour les noms de loft manquants
  - Ajouter des logs d'avertissement pour les cas d'erreur
  - Tester les scénarios avec données API incomplètes ou corrompues
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 11. Ajouter les tests unitaires pour les nouvelles fonctionnalités

  - Créer des tests pour les fonctions de formatage des titres
  - Tester la gestion des différentes langues et des fallbacks
  - Tester les cas d'erreur et les données manquantes
  - Assurer une couverture de test complète pour les nouvelles fonctions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [x] 12. Effectuer les tests d'intégration

  - Tester l'affichage complet du calendrier avec les nouveaux événements
  - Vérifier le changement de langue et l'affichage des traductions
  - Tester l'interaction avec l'API et la gestion des erreurs
  - Valider l'affichage sur différentes résolutions d'écran

  - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4_
