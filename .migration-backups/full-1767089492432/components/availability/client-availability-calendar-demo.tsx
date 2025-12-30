'use client'

import { useState } from 'react'
import { ClientAvailabilityCalendar } from './client-availability-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRange } from 'react-day-picker'
import { PricingBreakdown } from '@/lib/services/availability-service'

// Mock loft data for testing
const mockLoftData = {
  id: 'test-loft-1',
  name: 'Luxury Apartment in Algiers',
  pricePerNight: 150,
  minimumStay: 2,
  maximumStay: 14,
  cleaningFee: 50,
  taxRate: 0.19
}

export function ClientAvailabilityCalendarDemo() {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  const [pricing, setPricing] = useState<PricingBreakdown | undefined>()
  const [isAvailable, setIsAvailable] = useState<boolean>(false)
  const [restrictions, setRestrictions] = useState<string[]>([])

  const handleDateRangeSelect = (dateRange: DateRange | undefined, pricingData?: PricingBreakdown) => {
    setSelectedRange(dateRange)
    setPricing(pricingData)
    console.log('Date range selected:', dateRange)
    console.log('Pricing data:', pricingData)
  }

  const handleAvailabilityCheck = (available: boolean, restrictionMessages?: string[]) => {
    setIsAvailable(available)
    setRestrictions(restrictionMessages || [])
    console.log('Availability check:', { available, restrictions: restrictionMessages })
  }

  const handleBookNow = () => {
    if (selectedRange?.from && selectedRange?.to && pricing) {
      console.log('Booking initiated:', {
        loft: mockLoftData,
        dates: selectedRange,
        pricing
      })
      alert('Booking flow would start here!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Availability Calendar Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Component */}
            <div>
              <ClientAvailabilityCalendar
                loftData={mockLoftData}
                onDateRangeSelect={handleDateRangeSelect}
                onAvailabilityCheck={handleAvailabilityCheck}
              />
            </div>

            {/* Selection Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Loft Details</h4>
                    <div className="text-sm space-y-1">
                      <div>Name: {mockLoftData.name}</div>
                      <div>Price per night: €{mockLoftData.pricePerNight}</div>
                      <div>Minimum stay: {mockLoftData.minimumStay} nights</div>
                      <div>Maximum stay: {mockLoftData.maximumStay} nights</div>
                    </div>
                  </div>

                  {selectedRange?.from && selectedRange?.to && (
                    <div>
                      <h4 className="font-medium mb-2">Selected Dates</h4>
                      <div className="text-sm space-y-1">
                        <div>Check-in: {selectedRange.from.toLocaleDateString()}</div>
                        <div>Check-out: {selectedRange.to.toLocaleDateString()}</div>
                        <div>
                          Nights: {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))}
                        </div>
                      </div>
                    </div>
                  )}

                  {restrictions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Restrictions</h4>
                      <div className="text-sm space-y-1">
                        {restrictions.map((restriction, index) => (
                          <div key={index} className="text-red-600">• {restriction}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pricing && (
                    <div>
                      <h4 className="font-medium mb-2">Pricing Summary</h4>
                      <div className="text-sm space-y-1">
                        <div>Subtotal: €{pricing.subtotal}</div>
                        <div>Cleaning fee: €{pricing.cleaningFee}</div>
                        <div>Service fee: €{pricing.serviceFee}</div>
                        <div>Taxes: €{pricing.taxes}</div>
                        <div className="font-semibold border-t pt-1">
                          Total: €{pricing.total}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        Availability: 
                      </span>
                      <span className={`ml-2 text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {isAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={handleBookNow}
                      disabled={!isAvailable || !selectedRange?.from || !selectedRange?.to}
                      className="w-full"
                    >
                      {isAvailable && selectedRange?.from && selectedRange?.to 
                        ? 'Book Now' 
                        : 'Select Available Dates'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}