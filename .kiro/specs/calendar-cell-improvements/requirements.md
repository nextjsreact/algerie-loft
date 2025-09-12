# Requirements Document

## Introduction

Cette fonctionnalité vise à améliorer l'affichage du calendrier des réservations en ajustant les cellules (cases) des jours pour mieux lire leur contenu et en mentionnant le nom du loft dans le calendrier lorsque celui-ci est en maintenance ou bloqué. L'objectif est d'améliorer la lisibilité et l'utilité du calendrier pour les utilisateurs qui gèrent plusieurs lofts.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur gérant des réservations, je veux que les cellules du calendrier soient suffisamment grandes et bien formatées pour lire facilement leur contenu, afin de pouvoir rapidement identifier les informations importantes.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le calendrier THEN les cellules des jours SHALL avoir une hauteur minimale de 160px pour permettre l'affichage de plusieurs événements
2. WHEN du texte est affiché dans une cellule THEN le texte SHALL être lisible avec une taille de police appropriée (minimum 12px)
3. WHEN plusieurs événements sont présents dans une même cellule THEN ils SHALL être affichés de manière empilée sans se chevaucher
4. WHEN le contenu d'une cellule dépasse l'espace disponible THEN un indicateur "voir plus" SHALL être affiché
5. WHEN l'utilisateur survole une cellule THEN les informations complètes SHALL être visibles via un tooltip ou une expansion

### Requirement 2

**User Story:** En tant qu'utilisateur gérant plusieurs lofts, je veux voir le nom du loft affiché dans le calendrier pour les périodes de maintenance ou de blocage, afin de savoir rapidement quel loft est concerné sans avoir à cliquer sur l'événement.

#### Acceptance Criteria

1. WHEN un loft est en maintenance THEN le nom du loft SHALL être affiché dans l'événement du calendrier avec le format "Maintenance - [Nom du Loft]"
2. WHEN un loft est bloqué THEN le nom du loft SHALL être affiché dans l'événement du calendrier avec le format "Bloqué - [Nom du Loft]"
3. WHEN une raison de blocage est spécifiée THEN elle SHALL être affichée avec le nom du loft au format "[Raison] - [Nom du Loft]"
4. WHEN l'utilisateur consulte le calendrier sans filtre de loft spécifique THEN tous les événements de maintenance/blocage SHALL afficher le nom du loft concerné
5. WHEN l'utilisateur filtre par un loft spécifique THEN le nom du loft PEUT être omis des événements de maintenance/blocage pour éviter la redondance

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que les événements de réservation affichent des informations claires et complètes, afin de pouvoir rapidement identifier les détails importants sans avoir à ouvrir chaque réservation.

#### Acceptance Criteria

1. WHEN une réservation est affichée dans le calendrier THEN elle SHALL montrer le nom du client et le nom du loft
2. WHEN une réservation a un statut spécifique THEN elle SHALL être colorée selon son statut (confirmée: vert, en attente: orange, annulée: rouge, terminée: gris)
3. WHEN l'espace le permet THEN la durée du séjour SHALL être visible dans l'événement
4. WHEN l'utilisateur survole un événement de réservation THEN les détails complets (dates, montant, statut) SHALL être affichés dans un tooltip
5. WHEN plusieurs réservations se chevauchent visuellement THEN elles SHALL être distinguables par des couleurs ou des motifs différents

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le calendrier soit responsive et s'adapte à différentes tailles d'écran, afin de pouvoir l'utiliser efficacement sur desktop, tablette et mobile.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le calendrier sur desktop THEN toutes les informations SHALL être visibles dans les cellules
2. WHEN l'utilisateur consulte le calendrier sur tablette THEN les informations essentielles SHALL rester visibles avec une mise en page adaptée
3. WHEN l'utilisateur consulte le calendrier sur mobile THEN une vue simplifiée SHALL être proposée avec accès aux détails par tap
4. WHEN la largeur de l'écran est réduite THEN les noms longs SHALL être tronqués avec des ellipses et un tooltip complet
5. WHEN l'orientation de l'écran change THEN le calendrier SHALL s'adapter automatiquement à la nouvelle disposition