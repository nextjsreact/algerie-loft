'use client'

import { useRouter } from 'next/navigation'

interface PortalNavigationProps {
  currentPage?: string
  locale?: string
}

export function PortalNavigation({ currentPage, locale = 'fr' }: PortalNavigationProps) {
  const router = useRouter()

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      zIndex: 1000
    }}>
      <button
        onClick={() => router.push(`/${locale}`)}
        style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'white'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        🏛️ Retour au Portail
      </button>
      {currentPage && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#6B7280',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem'
        }}>
          {currentPage}
        </div>
      )}
    </div>
  )
}