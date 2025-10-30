'use client';

import { useState } from 'react';
import { BookingForm } from '@/components/reservations/booking-form';
import { PricingSummary } from '@/components/reservations/pricing-summary';
import { calculatePricing } from '@/lib/utils/pricing';
import { User, Loft } from '@/lib/types';
import { ReservationRequest } from '@/lib/schemas/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Example data - in real implementation, this would come from props or API
const exampleLoft: Loft = {
  id: 'loft-1',
  name: 'Luxury Apartment in Paris',
  address: '123 Rue de Rivoli, 75001 Paris, France',
  description: 'Beautiful apartment in the heart of Paris',
  price_per_month: 2500,
  price_per_night: 120,
  status: 'available',
  owner_id: 'owner-1',
  company_percentage: 20,
  owner_percentage: 80,
  max_guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  area_sqm: 65,
  amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Balcony'],
  is_published: true
};

const exampleUser: User = {
  id: 'user-1',
  email: 'john.doe@example.com',
  full_name: 'John Doe',
  role: 'client'
};

interface BookingFormExampleProps {
  className?: string;
}

export function BookingFormExample({ className }: BookingFormExampleProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReservation, setSubmittedReservation] = useState<ReservationRequest | null>(null);

  // Example booking parameters
  const checkIn = '2024-12-15';
  const checkOut = '2024-12-18';
  const guests = 2;

  // Calculate pricing
  const pricing = calculatePricing({
    loft: exampleLoft,
    checkIn,
    checkOut,
    guests
  });

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  const handleSubmit = async (reservation: ReservationRequest) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would make an API call
    console.log('Submitting reservation:', reservation);
    
    setSubmittedReservation(reservation);
    setIsSubmitted(true);
    toast.success('Reservation submitted successfully!');
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmittedReservation(null);
  };

  if (isSubmitted && submittedReservation) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Reservation Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Property:</strong> {exampleLoft.name}</p>
                <p><strong>Guest:</strong> {submittedReservation.guestInfo.primaryGuest.firstName} {submittedReservation.guestInfo.primaryGuest.lastName}</p>
                <p><strong>Email:</strong> {submittedReservation.guestInfo.primaryGuest.email}</p>
                <p><strong>Dates:</strong> {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}</p>
                <p><strong>Guests:</strong> {guests}</p>
                <p><strong>Total:</strong> €{pricing.total.toFixed(2)}</p>
              </div>
            </div>
            
            <Button onClick={handleReset} variant="outline" className="w-full">
              Create Another Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Main Booking Form */}
      <div className="lg:col-span-2">
        <BookingForm
          loft={exampleLoft}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          user={exampleUser}
          pricing={pricing}
          onSubmit={handleSubmit}
          onCancel={handleReset}
        />
      </div>

      {/* Pricing Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <PricingSummary
            pricing={pricing}
            nights={nights}
            className="mb-4"
          />
          
          {/* Property Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">{exampleLoft.name}</h4>
                <p className="text-sm text-muted-foreground">{exampleLoft.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Bedrooms:</span>
                  <span className="ml-1 font-medium">{exampleLoft.bedrooms}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bathrooms:</span>
                  <span className="ml-1 font-medium">{exampleLoft.bathrooms}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Area:</span>
                  <span className="ml-1 font-medium">{exampleLoft.area_sqm}m²</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Guests:</span>
                  <span className="ml-1 font-medium">{exampleLoft.max_guests}</span>
                </div>
              </div>

              {exampleLoft.amenities && exampleLoft.amenities.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Amenities</h5>
                  <div className="flex flex-wrap gap-1">
                    {exampleLoft.amenities.map((amenity, index) => (
                      <span 
                        key={index}
                        className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}