'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Calendar,
  Settings,
  History,
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { UserProfileIntegration } from './user-profile-integration';
import { BookingHistory } from './booking-history';
import { EnhancedBookingForm } from './enhanced-booking-form';
import { UserProfileDashboard } from './user-profile-dashboard';
import { toast } from 'sonner';

interface ProfileIntegrationExampleProps {
  user: any;
  className?: string;
}

// Mock loft data for demonstration
const mockLoft = {
  id: 'loft-demo',
  name: 'Luxury Apartment Downtown',
  address: '123 Main Street, Algiers',
  description: 'Beautiful modern apartment in the heart of the city',
  price_per_night: 150,
  status: 'available' as const,
  owner_id: 'owner-1',
  company_percentage: 20,
  owner_percentage: 80,
  max_guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  area_sqm: 85,
  amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Balcony'],
  is_published: true
};

// Mock pricing data
const mockPricing = {
  nightlyRate: 150,
  nights: 3,
  subtotal: 450,
  cleaningFee: 50,
  serviceFee: 25,
  taxes: 47.5,
  total: 572.5,
  currency: 'EUR'
};

export function ProfileIntegrationExample({ user, className }: ProfileIntegrationExampleProps) {
  const t = useTranslations('profileIntegration');
  const [activeDemo, setActiveDemo] = useState('dashboard');
  const [bookingStep, setBookingStep] = useState(1);

  const handleReservationSubmit = async (reservation: any) => {
    // Simulate booking submission
    toast.success(t('bookingSubmitted'));
    console.log('Reservation submitted:', reservation);
  };

  const features = [
    {
      id: 'profile-prefill',
      title: t('profilePreFill'),
      description: t('profilePreFillDescription'),
      icon: <Sparkles className="h-5 w-5" />,
      status: 'implemented'
    },
    {
      id: 'profile-update',
      title: t('profileUpdate'),
      description: t('profileUpdateDescription'),
      icon: <User className="h-5 w-5" />,
      status: 'implemented'
    },
    {
      id: 'preference-management',
      title: t('preferenceManagement'),
      description: t('preferenceManagementDescription'),
      icon: <Settings className="h-5 w-5" />,
      status: 'implemented'
    },
    {
      id: 'booking-history',
      title: t('bookingHistory'),
      description: t('bookingHistoryDescription'),
      icon: <History className="h-5 w-5" />,
      status: 'implemented'
    }
  ];

  return (
    <div className={className}>
      {/* Feature Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.id} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    {feature.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {t(feature.status)}
                  </Badge>
                </div>
                <h4 className="font-medium mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs value={activeDemo} onValueChange={setActiveDemo}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('history')}
          </TabsTrigger>
        </TabsList>

        {/* User Profile Dashboard Demo */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboardDemo')}</CardTitle>
              <CardDescription>{t('dashboardDemoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileDashboard user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Management Demo */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileDemo')}</CardTitle>
              <CardDescription>{t('profileDemoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileIntegration
                user={user}
                onProfileUpdate={(profile) => {
                  toast.success(t('profileUpdated'));
                  console.log('Profile updated:', profile);
                }}
                onDataPreFill={(data) => {
                  toast.success(t('dataPreFilled'));
                  console.log('Data pre-filled:', data);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Booking Form Demo */}
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('bookingDemo')}</CardTitle>
                  <CardDescription>{t('bookingDemoDescription')}</CardDescription>
                </div>
                <Badge variant="outline">
                  {t('step')} {bookingStep}/4
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-medium mb-2">{t('demoInstructions')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('demoInstructionsText')}
                    </p>
                    <Button onClick={() => setBookingStep(2)}>
                      {t('startDemo')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <EnhancedBookingForm
                  loft={mockLoft}
                  checkIn="2024-03-15"
                  checkOut="2024-03-18"
                  guests={2}
                  user={user}
                  pricing={mockPricing}
                  onSubmit={handleReservationSubmit}
                  onCancel={() => setBookingStep(1)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking History Demo */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t('historyDemo')}</CardTitle>
              <CardDescription>{t('historyDemoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingHistory userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('implementationNotes')}</CardTitle>
          <CardDescription>{t('implementationNotesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <h4 className="font-medium text-green-700 mb-2">{t('completed')}</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>✓ {t('profileDataPreFilling')}</li>
                <li>✓ {t('profileUpdateFunctionality')}</li>
                <li>✓ {t('userPreferenceManagement')}</li>
                <li>✓ {t('bookingHistoryInterface')}</li>
                <li>✓ {t('enhancedBookingForm')}</li>
                <li>✓ {t('userProfileDashboard')}</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-medium text-blue-700 mb-2">{t('technicalDetails')}</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• {t('reactHookFormIntegration')}</li>
                <li>• {t('zodValidationSchemas')}</li>
                <li>• {t('supabaseBackendIntegration')}</li>
                <li>• {t('responsiveDesign')}</li>
                <li>• {t('internationalizationSupport')}</li>
                <li>• {t('accessibilityCompliant')}</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <h4 className="font-medium text-orange-700 mb-2">{t('nextSteps')}</h4>
              <ul className="text-sm text-orange-600 space-y-1">
                <li>• {t('connectToRealAPI')}</li>
                <li>• {t('addPaymentIntegration')}</li>
                <li>• {t('implementNotifications')}</li>
                <li>• {t('addAdvancedFiltering')}</li>
                <li>• {t('optimizePerformance')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}