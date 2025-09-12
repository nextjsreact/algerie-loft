# Design Document

## Overview

Cette fonctionnalité améliore l'affichage du calendrier des réservations en ajoutant le nom du loft dans les cellules lorsque celui-ci est en maintenance ou bloqué. Le système actuel affiche déjà les événements bloqués mais ne montre pas clairement quel loft est concerné, particulièrement problématique lors de la gestion de plusieurs lofts.

L'implémentation se concentre sur l'amélioration du composant `ReservationCalendar` existant et de l'API `availability` pour fournir des informations plus détaillées et une meilleure expérience utilisateur.

## Architecture

### Composants Affectés

1. **ReservationCalendar Component** (`components/reservations/reservation-calendar.tsx`)
   - Composant principal qui affiche le calendrier
   - Gère les événements de réservation et de disponibilité
   - Utilise react-big-calendar pour l'affichage

2. **Availability API** (`app/api/availability/route.ts`)
   - Fournit les données de disponibilité avec les informations de loft
   - Déjà configuré pour inclure les noms de loft dans les réponses

3. **Translation System** (`lib/reservations-translations.ts`)
   - Système de traduction existant pour les réservations
   - Nécessite l'ajout de nouvelles clés pour les types de blocage

### Flux de Données

```
API Availability → ReservationCalendar → react-big-calendar
     ↓                    ↓                      ↓
Données avec         Formatage des         Affichage avec
nom du loft         événements avec        nom du loft
                    nom du loft            visible
```

## Components and Interfaces

### Interface CalendarEvent (Mise à jour)

```typescript
interface CalendarEvent {
  id: string;
  title: string; // Inclura maintenant le nom du loft pour les blocages
  start: Date;
  end: Date;
  resource: Reservation | AvailabilityResource;
  status: string;
  loftName?: string; // Nouveau champ pour faciliter l'accès
}

interface AvailabilityResource {
  date: string;
  is_available: boolean;
  blocked_reason: string;
  price_override: number | null;
  minimum_stay: number;
  loft_name: string; // Déjà disponible dans l'API
  reservation: {
    status: string;
    guest_name: string;
    loft_name: string;
  } | null;
}
```

### Nouvelles Fonctions de Formatage

```typescript
// Fonction pour formater le titre des événements bloqués
const formatBlockedEventTitle = (
  blockedReason: string, 
  loftName: string, 
  locale: string
): string => {
  const reasonKey = getBlockedReasonKey(blockedReason);
  const translatedReason = t(`availability.${reasonKey}`);
  return `${translatedReason} - ${loftName}`;
};

// Fonction pour déterminer la clé de traduction
const getBlockedReasonKey = (reason: string): string => {
  switch (reason.toLowerCase()) {
    case 'maintenance': return 'maintenance';
    case 'renovation': return 'renovation';
    default: return 'blocked';
  }
};
```

## Data Models

### Structure de Données Existante (API Availability)

L'API retourne déjà les informations nécessaires :

```typescript
// Réponse de l'API pour le calendrier
{
  calendar: [
    {
      date: "2024-01-15",
      is_available: false,
      blocked_reason: "maintenance",
      price_override: null,
      minimum_stay: 1,
      reservation: null,
      loft_name: "Loft Moderne Centre-ville" // Déjà disponible
    }
  ]
}
```

### Nouvelles Traductions Requises

```typescript
// Ajouts à reservations-translations.ts
const newTranslations = {
  fr: {
    'reservations.availability.maintenance': 'Maintenance',
    'reservations.availability.renovation': 'Rénovation',
    'reservations.availability.blocked': 'Bloqué',
    'reservations.availability.other': 'Autre raison'
  },
  en: {
    'reservations.availability.maintenance': 'Maintenance',
    'reservations.availability.renovation': 'Renovation', 
    'reservations.availability.blocked': 'Blocked',
    'reservations.availability.other': 'Other reason'
  },
  ar: {
    'reservations.availability.maintenance': 'صيانة',
    'reservations.availability.renovation': 'تجديد',
    'reservations.availability.blocked': 'محظور',
    'reservations.availability.other': 'سبب آخر'
  }
};
```

## Error Handling

### Gestion des Cas d'Erreur

1. **Nom de Loft Manquant**
   - Fallback vers l'ID du loft si le nom n'est pas disponible
   - Log d'avertissement pour investigation

2. **Traduction Manquante**
   - Fallback vers la clé originale si la traduction n'existe pas
   - Affichage de la raison brute en dernier recours

3. **Données API Incomplètes**
   - Validation des données reçues de l'API
   - Affichage d'un message générique si les données sont corrompues

### Stratégies de Fallback

```typescript
const getSafeEventTitle = (
  blockedReason: string,
  loftName: string | undefined,
  loftId: string,
  locale: string
): string => {
  const safeLoftName = loftName || `Loft ${loftId.slice(-4)}`;
  const safeReason = blockedReason || 'blocked';
  
  try {
    return formatBlockedEventTitle(safeReason, safeLoftName, locale);
  } catch (error) {
    console.warn('Translation error:', error);
    return `${safeReason} - ${safeLoftName}`;
  }
};
```

## Testing Strategy

### Tests Unitaires

1. **Formatage des Titres d'Événements**
   - Test avec différentes raisons de blocage
   - Test avec différentes langues
   - Test des cas de fallback

2. **Gestion des Données Manquantes**
   - Test avec nom de loft manquant
   - Test avec raison de blocage manquante
   - Test avec données API incomplètes

### Tests d'Intégration

1. **Affichage du Calendrier**
   - Vérification que les noms de loft apparaissent correctement
   - Test de l'affichage multilingue
   - Test de la responsivité des cellules

2. **Interaction avec l'API**
   - Test de la récupération des données avec noms de loft
   - Test de la gestion des erreurs API

### Tests E2E

1. **Scénarios Utilisateur**
   - Navigation dans le calendrier avec lofts bloqués
   - Changement de langue et vérification des traductions
   - Affichage sur différentes tailles d'écran

## Améliorations de Style

### CSS Personnalisé pour les Cellules

```css
.rbc-event-blocked {
  background-color: #a1a1aa;
  border-color: #71717a;
  font-weight: 500;
}

.rbc-event-maintenance {
  background-color: #f59e0b;
  border-color: #d97706;
  font-weight: 500;
}

.rbc-event-renovation {
  background-color: #8b5cf6;
  border-color: #7c3aed;
  font-weight: 500;
}

.rbc-event-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1.2;
}
```

### Tooltip pour Informations Complètes

Implémentation d'un tooltip personnalisé pour afficher les informations complètes lorsque le texte est tronqué :

```typescript
const EventTooltip = ({ event }: { event: CalendarEvent }) => (
  <div className="bg-gray-900 text-white p-2 rounded shadow-lg text-sm max-w-xs">
    <div className="font-semibold">{event.loftName}</div>
    <div>{event.title}</div>
    {event.resource.blocked_reason && (
      <div className="text-gray-300 mt-1">
        {t(`availability.${getBlockedReasonKey(event.resource.blocked_reason)}`)}
      </div>
    )}
  </div>
);
```

## Performance Considerations

### Optimisations

1. **Mise en Cache des Traductions**
   - Cache des traductions formatées pour éviter les recalculs
   - Invalidation du cache lors du changement de langue

2. **Optimisation du Rendu**
   - Mémorisation des événements formatés
   - Éviter les recalculs inutiles lors des re-rendus

3. **Gestion de la Mémoire**
   - Nettoyage des event listeners lors du démontage
   - Optimisation des requêtes API pour éviter les doublons

Cette conception s'appuie sur l'architecture existante tout en ajoutant les améliorations nécessaires pour répondre aux exigences identifiées.