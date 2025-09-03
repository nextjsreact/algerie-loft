'use client'

import { useState } from 'react'
import { FilterPanel } from './filter-panel'
import { AvailabilityCalendar } from './availability-calendar'
import { LoftGrid } from './loft-grid'
import { Button } from '@/components/ui/button'
import { Calendar, Grid3X3 } from 'lucide-react'

// Données de démonstration
const mockLofts = [
  {
    id: '1',
    name: 'Loft Moderne Centre-Ville',
    region: 'centre-ville',
    owner: 'Ahmed Benali',
    capacity: 4,
    pricePerNight: 8000,
    status: 'available',
    amenities: ['wifi', 'parking', 'kitchen', 'ac'],
    availability: {
      '2024-01-15': 'available',
      '2024-01-16': 'occupied',
      '2024-01-17': 'available'
    }
  },
  {
    id: '2',
    name: 'Studio Hydra Premium',
    region: 'hydra',
    owner: 'Fatima Khelil',
    capacity: 2,
    pricePerNight: 12000,
    status: 'available',
    amenities: ['wifi', 'kitchen', 'balcony'],
    availability: {
      '2024-01-15': 'available',
      '2024-01-16': 'available',
      '2024-01-17': 'maintenance'
    }
  },
  {
    id: '3',
    name: 'Loft Familial Kouba',
    region: 'kouba',
    owner: 'Mohamed Salem',
    capacity: 6,
    pricePerNight: 6000,
    status: 'occupied',
    amenities: ['wifi', 'parking', 'kitchen'],
    availability: {
      '2024-01-15': 'occupied',
      '2024-01-16': 'occupied',
      '2024-01-17': 'available'
    }
  },
  {
    id: '4',
    name: 'Penthouse Bab Ezzouar',
    region: 'bab-ezzouar',
    owner: 'Sara Boumediene',
    capacity: 8,
    pricePerNight: 15000,
    status: 'available',
    amenities: ['wifi', 'parking', 'kitchen', 'ac', 'balcony'],
    availability: {
      '2024-01-15': 'available',
      '2024-01-16': 'available',
      '2024-01-17': 'available'
    }
  },
  {
    id: '5',
    name: 'Loft Étudiant Kouba',
    region: 'kouba',
    owner: 'Karim Messaoudi',
    capacity: 3,
    pricePerNight: 4500,
    status: 'maintenance',
    amenities: ['wifi', 'kitchen'],
    availability: {
      '2024-01-15': 'maintenance',
      '2024-01-16': 'maintenance',
      '2024-01-17': 'available'
    }
  }
]

export function AvailabilityDemo() {
  const [view, setView] = useState<'calendar' | 'grid'>('grid')
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    region: 'all',
    owners: [], // Nouveau filtre multi-sélection
    loft: 'all',
    guests: 2,
    minPrice: 0,
    maxPrice: 50000
  })

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Démonstration du Filtre Multi-Propriétaires</h1>
        <p className="text-muted-foreground">
          Testez le nouveau filtre de sélection multiple pour les propriétaires
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de filtres */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isLoading={false}
          />
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {/* Sélecteur de vue */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Vue Grille
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Vue Calendrier
            </Button>
          </div>

          {/* Affichage des filtres actifs */}
          {filters.owners && filters.owners.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Propriétaires sélectionnés: {filters.owners.join(', ')}
              </p>
            </div>
          )}

          {/* Contenu selon la vue */}
          {view === 'grid' ? (
            <LoftGrid
              data={mockLofts}
              filters={filters}
              isLoading={false}
            />
          ) : (
            <AvailabilityCalendar
              data={mockLofts}
              filters={filters}
              isLoading={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}