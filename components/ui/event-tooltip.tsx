"use client"

import { useState } from 'react'
import type { CalendarEvent } from '@/types/calendar'
import { getBlockedReasonKey, getReservationTranslation } from '@/lib/reservations-translations'
import { useLocale } from 'next-intl'

interface EventTooltipProps {
  event: CalendarEvent
  children: React.ReactNode
}

export function EventTooltip({ event, children }: EventTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const locale = useLocale()

  const getTooltipContent = () => {
    if ('guest_name' in event.resource) {
      // Reservation event
      return {
        title: event.resource.lofts.name,
        subtitle: `Réservation - ${event.resource.guest_name}`,
        details: [
          `Statut: ${event.resource.status}`,
          `Montant: ${event.resource.total_amount} DZD`,
          `Email: ${event.resource.guest_email}`
        ]
      }
    } else {
      // Availability event (blocked)
      const reasonKey = getBlockedReasonKey(event.resource.blocked_reason || '')
      const translatedReason = getReservationTranslation(`reservations.availability.${reasonKey}`, locale)
      
      return {
        title: event.loftName || 'Loft Inconnu',
        subtitle: translatedReason,
        details: [
          `Date: ${event.resource.date}`,
          `Raison: ${event.resource.blocked_reason || 'Non spécifiée'}`,
          event.resource.price_override ? `Prix forcé: ${event.resource.price_override} DZD` : null,
          `Séjour minimum: ${event.resource.minimum_stay} nuit(s)`
        ].filter(Boolean) as string[]
      }
    }
  }

  const tooltipContent = getTooltipContent()

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm max-w-xs">
            <div className="font-semibold text-white mb-1">
              {tooltipContent.title}
            </div>
            <div className="text-gray-300 mb-2">
              {tooltipContent.subtitle}
            </div>
            <div className="space-y-1">
              {tooltipContent.details.map((detail, index) => (
                <div key={index} className="text-gray-400 text-xs">
                  {detail}
                </div>
              ))}
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}