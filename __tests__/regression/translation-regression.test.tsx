import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { EditLoftPageClient } from '@/app/[locale]/lofts/[id]/edit/edit-loft-page-client'

// Mock des données de test
const mockLoft = { id: '1', name: 'Test Loft' }
const mockOwners = []
const mockZoneAreas = []
const mockInternetConnectionTypes = []

// Messages de test
const mockMessages = {
  lofts: {
    editLoft: 'Modifier l\'appartement',
    updatePropertyDetails: 'Mettre à jour les détails de la propriété'
  }
}

describe('EditLoftPageClient Translation Test', () => {
  it('should display translated text correctly', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={mockMessages}>
        <EditLoftPageClient 
          loft={mockLoft}
          owners={mockOwners}
          zoneAreas={mockZoneAreas}
          internetConnectionTypes={mockInternetConnectionTypes}
        />
      </NextIntlClientProvider>
    )
    
    // Vérifier que les traductions sont affichées
    expect(screen.getByText('Modifier l\'appartement')).toBeInTheDocument()
    expect(screen.getByText('Mettre à jour les détails de la propriété')).toBeInTheDocument()
  })
  
  it('should handle missing translations gracefully', () => {
    const incompleteMessages = { lofts: {} }
    
    render(
      <NextIntlClientProvider locale="fr" messages={incompleteMessages}>
        <EditLoftPageClient 
          loft={mockLoft}
          owners={mockOwners}
          zoneAreas={mockZoneAreas}
          internetConnectionTypes={mockInternetConnectionTypes}
        />
      </NextIntlClientProvider>
    )
    
    // Vérifier le fallback (devrait afficher la clé)
    expect(screen.getByText('editLoft')).toBeInTheDocument()
  })
})