# Design Document - Multi-Role Booking System

## Overview

Le système multi-rôles étend l'application existante avec trois nouveaux types d'utilisateurs : **Client**, **Partner**, et maintient les rôles existants pour les employés. L'architecture s'appuie sur le système d'authentification Supabase existant et le système de permissions déjà en place, en ajoutant de nouvelles interfaces spécialisées et des flux de données optimisés pour chaque type d'utilisateur.

## Architecture

### Extension du Système de Rôles Existant

L'application utilise actuellement 5 rôles : `admin`, `manager`, `executive`, `member`, `guest`. Nous ajoutons :

- **`client`** : Utilisateur final qui réserve des lofts
- **`partner`** : Propriétaire/gestionnaire de biens qui loue ses lofts

### Structure des Interfaces

```
/[locale]/
├── public/                    # Page vitrine existante
├── login/                     # Connexion avec sélection de rôle
├── register/                  # Inscription différenciée
│   ├── client/               # Inscription client simplifiée
│   └── partner/              # Inscription partenaire avec validation
├── client/                   # Interface client (nouveau)
│   ├── search/              # Recherche de lofts
│   ├── booking/             # Processus de réservation
│   ├── reservations/        # Gestion des réservations
│   └── profile/             # Profil client
├── partner/                 # Interface partenaire (nouveau)
│   ├── dashboard/           # Vue d'ensemble partenaire
│   ├── properties/          # Gestion des biens
│   ├── bookings/            # Réservations reçues
│   └── earnings/            # Rapports financiers
└── app/                     # Interface employés existante
    ├── dashboard/           # Tableau de bord admin
    ├── lofts/              # Gestion complète des lofts
    └── ...                 # Autres modules existants
```

## Components and Interfaces

### 1. Système d'Authentification Étendu

#### Modification du Processus de Connexion
```typescript
// Extension de lib/auth.ts
export type ExtendedUserRole = UserRole | 'client' | 'partner';

// Nouveau flux d'inscription avec sélection de rôle
export async function registerWithRole(
  email: string,
  password: string,
  fullName: string,
  role: 'client' | 'partner',
  additionalData?: PartnerRegistrationData
): Promise<{ success: boolean; error?: string; requiresApproval?: boolean }>
```

#### Composant de Sélection de Rôle
```typescript
// components/auth/role-selector.tsx
interface RoleSelectorProps {
  onRoleSelect: (role: 'client' | 'partner' | 'employee') => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelect }) => {
  // Interface avec 3 cartes distinctes pour chaque type d'utilisateur
  // - Client : "Je veux réserver un loft"
  // - Partenaire : "Je veux louer mes biens"
  // - Employé : "J'ai un code d'accès employé"
}
```

### 2. Interface Client

#### Moteur de Recherche
```typescript
// components/client/search-engine.tsx
interface SearchFilters {
  dates: { checkIn: Date; checkOut: Date };
  location?: string;
  priceRange: { min: number; max: number };
  amenities: string[];
  guests: number;
}

interface SearchResults {
  lofts: ClientLoftView[];
  totalCount: number;
  filters: AvailableFilters;
}
```

#### Système de Réservation
```typescript
// components/client/booking-flow.tsx
interface BookingFlow {
  steps: ['selection', 'details', 'payment', 'confirmation'];
  currentStep: number;
  bookingData: {
    loft: ClientLoftView;
    dates: DateRange;
    guests: number;
    totalPrice: number;
    fees: BookingFees;
  };
}
```

### 3. Interface Partenaire

#### Tableau de Bord Partenaire
```typescript
// components/partner/dashboard.tsx
interface PartnerDashboard {
  overview: {
    totalProperties: number;
    activeBookings: number;
    monthlyEarnings: number;
    occupancyRate: number;
  };
  recentBookings: Booking[];
  propertyPerformance: PropertyStats[];
}
```

#### Gestion des Propriétés
```typescript
// components/partner/property-management.tsx
interface PropertyManagement {
  properties: PartnerProperty[];
  actions: {
    addProperty: (property: NewProperty) => Promise<void>;
    updateProperty: (id: string, updates: PropertyUpdates) => Promise<void>;
    manageAvailability: (id: string, calendar: AvailabilityCalendar) => Promise<void>;
    setPricing: (id: string, pricing: DynamicPricing) => Promise<void>;
  };
}
```

## Data Models

### Extension des Modèles Existants

#### Nouveau Rôle dans le Système de Permissions
```typescript
// Extension de lib/permissions/types.ts
export const EXTENDED_ROLE_PERMISSIONS: RolePermissions = {
  ...ROLE_PERMISSIONS,
  client: [
    { resource: 'lofts', action: 'read', scope: 'public' },
    { resource: 'bookings', action: '*', scope: 'own' },
    { resource: 'profile', action: '*', scope: 'own' },
    { resource: 'messages', action: '*', scope: 'own' }
  ],
  partner: [
    { resource: 'lofts', action: '*', scope: 'own' },
    { resource: 'bookings', action: 'read', scope: 'own' },
    { resource: 'earnings', action: 'read', scope: 'own' },
    { resource: 'messages', action: '*', scope: 'own' },
    { resource: 'analytics', action: 'read', scope: 'own' }
  ]
};
```

#### Nouveaux Modèles de Données

```typescript
// Types pour le système de réservation
export interface Booking {
  id: string;
  loft_id: string;
  client_id: string;
  partner_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface ClientLoftView {
  id: string;
  name: string;
  address: string;
  description: string;
  price_per_night: number;
  images: string[];
  amenities: string[];
  availability: AvailabilityCalendar;
  rating: number;
  reviews_count: number;
  partner: {
    id: string;
    name: string;
    rating: number;
  };
}

export interface PartnerProperty extends Loft {
  bookings_count: number;
  total_earnings: number;
  occupancy_rate: number;
  average_rating: number;
  is_published: boolean;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_type: 'individual' | 'company';
  tax_id?: string;
  address: string;
  phone: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents: string[];
  bank_details: BankDetails;
  created_at: string;
}
```

### Schéma de Base de Données

```sql
-- Extension de la table profiles existante
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_profile_id UUID REFERENCES partner_profiles(id);

-- Nouvelle table pour les profils partenaires
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company')),
  tax_id TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents TEXT[],
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réservations
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des disponibilités
CREATE TABLE loft_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_override DECIMAL(10,2),
  minimum_stay INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(loft_id, date)
);

-- Table des messages entre clients et partenaires
CREATE TABLE booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

### Gestion des Erreurs par Rôle

```typescript
// lib/errors/booking-errors.ts
export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public userRole: ExtendedUserRole
  ) {
    super(message);
  }
}

export const BookingErrorCodes = {
  LOFT_NOT_AVAILABLE: 'loft_not_available',
  PAYMENT_FAILED: 'payment_failed',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PARTNER_NOT_VERIFIED: 'partner_not_verified',
  BOOKING_CONFLICT: 'booking_conflict'
} as const;
```

### Middleware de Validation des Rôles

```typescript
// middleware/role-validation.ts
export function validateRoleAccess(
  allowedRoles: ExtendedUserRole[]
) {
  return async (request: NextRequest) => {
    const session = await getSession();
    
    if (!session || !allowedRoles.includes(session.user.role as ExtendedUserRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  };
}
```

## Testing Strategy

### Tests par Type d'Utilisateur

#### Tests Client
- Recherche et filtrage de lofts
- Processus de réservation complet
- Gestion des réservations existantes
- Communication avec les partenaires

#### Tests Partenaire
- Inscription et processus de vérification
- Gestion des propriétés
- Réception et traitement des réservations
- Rapports financiers

#### Tests d'Intégration
- Flux complet de réservation (client → partenaire → admin)
- Système de notifications multi-rôles
- Gestion des conflits de disponibilité
- Processus de paiement et remboursement

### Tests de Sécurité
```typescript
// __tests__/security/role-isolation.test.ts
describe('Role Isolation Security', () => {
  it('should prevent clients from accessing partner data', async () => {
    const clientSession = await createClientSession();
    const response = await request(app)
      .get('/api/partner/earnings')
      .set('Authorization', `Bearer ${clientSession.token}`);
    
    expect(response.status).toBe(403);
  });

  it('should prevent partners from accessing other partners data', async () => {
    const partnerSession = await createPartnerSession();
    const response = await request(app)
      .get('/api/partner/properties?partner_id=other-partner-id')
      .set('Authorization', `Bearer ${partnerSession.token}`);
    
    expect(response.status).toBe(403);
  });
});
```

### Performance Testing
- Tests de charge sur le système de recherche
- Tests de concurrence pour les réservations
- Tests de performance des tableaux de bord multi-rôles

## Migration Strategy

### Phase 1 : Extension du Système d'Authentification
1. Ajout des nouveaux rôles dans la base de données
2. Extension du système de permissions
3. Mise à jour des middlewares d'authentification

### Phase 2 : Interface Client
1. Développement du moteur de recherche
2. Implémentation du système de réservation
3. Interface de gestion des réservations clients

### Phase 3 : Interface Partenaire
1. Système d'inscription et de vérification
2. Tableau de bord partenaire
3. Gestion des propriétés et disponibilités

### Phase 4 : Intégration et Optimisation
1. Tests d'intégration complets
2. Optimisation des performances
3. Déploiement progressif avec feature flags

## Security Considerations

### Isolation des Données
- RLS (Row Level Security) pour isoler les données par rôle
- Validation stricte des permissions à chaque requête API
- Chiffrement des données sensibles (informations bancaires)

### Audit et Conformité
- Extension du système d'audit existant pour les nouvelles actions
- Logs détaillés des transactions financières
- Conformité GDPR pour les données clients et partenaires

### Protection contre les Abus
- Rate limiting sur les API de recherche et réservation
- Système de détection de fraude pour les paiements
- Validation des documents partenaires avec vérification manuelle