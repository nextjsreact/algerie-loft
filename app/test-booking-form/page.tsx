import { BookingFormExample } from '@/components/examples/booking-form-example';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Form Test - LoftAlgerie',
  description: 'Test page for the new booking form component',
};

export default function TestBookingFormPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Booking Form Test</h1>
          <p className="text-muted-foreground">
            This is a test page for the new multi-step booking form component.
          </p>
        </div>
        
        <BookingFormExample />
      </div>
    </div>
  );
}