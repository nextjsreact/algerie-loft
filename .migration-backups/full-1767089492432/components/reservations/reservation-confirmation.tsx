'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  MapPin, 
  Euro, 
  Mail, 
  Phone, 
  Clock,
  Download,
  Share2,
  MessageCircle,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import type { ReservationRequest, PricingBreakdown, Loft, User } from '@/lib/schemas/booking';

interface ReservationConfirmationProps {
  reservation: ReservationRequest & {
    id: string;
    confirmationCode: string;
    bookingReference: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
  };
  loft: Loft;
  user: User;
  onContinue?: () => void;
  onDownloadConfirmation?: () => void;
  onShareReservation?: () => void;
  className?: string;
}

export function ReservationConfirmation({
  reservation,
  loft,
  user,
  onContinue,
  onDownloadConfirmation,
  onShareReservation,
  className
}: ReservationConfirmationProps) {
  const t = useTranslations('booking');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate nights
  const nights = Math.ceil(
    (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  // Send confirmation email on component mount
  useEffect(() => {
    sendConfirmationEmail();
  }, []);

  const sendConfirmationEmail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reservations/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          email: reservation.guestInfo.primaryGuest.email
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        toast.success(t('confirmation.emailSent'));
      } else {
        throw new Error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      toast.error(t('confirmation.emailError'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyBookingReference = async () => {
    try {
      await navigator.clipboard.writeText(reservation.bookingReference);
      setCopied(true);
      toast.success(t('confirmation.referencecopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('confirmation.copyError'));
    }
  };

  const handleDownload = () => {
    if (onDownloadConfirmation) {
      onDownloadConfirmation();
    } else {
      // Default download implementation
      window.print();
    }
  };

  const handleShare = () => {
    if (onShareReservation) {
      onShareReservation();
    } else {
      // Default share implementation
      if (navigator.share) {
        navigator.share({
          title: t('confirmation.shareTitle'),
          text: t('confirmation.shareText', { 
            loftName: loft.name,
            reference: reservation.bookingReference 
          }),
          url: window.location.href
        });
      } else {
        copyBookingReference();
      }
    }
  };

  return (
    <div className={className}>
      {/* Success Header */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-900 mb-2">
              {t('confirmation.title')}
            </h1>
            <p className="text-green-700 mb-4">
              {t('confirmation.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-lg px-4 py-2 border-green-300 text-green-800">
                {reservation.bookingReference}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyBookingReference}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {emailSent && (
              <Alert className="border-green-200 bg-green-50">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {t('confirmation.emailConfirmation', { 
                    email: reservation.guestInfo.primaryGuest.email 
                  })}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reservation Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('confirmation.reservationDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{loft.name}</h3>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span className="text-sm">{loft.address}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('confirmation.checkIn')}</span>
                  <p className="font-medium">
                    {new Date(reservation.checkIn).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">15:00</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('confirmation.checkOut')}</span>
                  <p className="font-medium">
                    {new Date(reservation.checkOut).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">11:00</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {reservation.guests} {reservation.guests === 1 ? t('confirmation.guest') : t('confirmation.guests')}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {nights} {nights === 1 ? t('confirmation.night') : t('confirmation.nights')}
                </span>
              </div>
            </div>

            {/* Guest Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('confirmation.primaryGuest')}</h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {reservation.guestInfo.primaryGuest.firstName} {reservation.guestInfo.primaryGuest.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{reservation.guestInfo.primaryGuest.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{reservation.guestInfo.primaryGuest.phone}</span>
                  </div>
                </div>
              </div>

              {reservation.guestInfo.additionalGuests && reservation.guestInfo.additionalGuests.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t('confirmation.additionalGuests')}</h4>
                  <div className="space-y-1 text-sm">
                    {reservation.guestInfo.additionalGuests.map((guest, index) => (
                      <p key={index} className="text-muted-foreground">
                        {guest.firstName} {guest.lastName} ({guest.age} {t('confirmation.yearsOld')})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              {t('confirmation.pricingBreakdown')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>€{reservation.pricing.nightlyRate.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <span>€{reservation.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('confirmation.cleaningFee')}</span>
                <span>€{reservation.pricing.cleaningFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('confirmation.serviceFee')}</span>
                <span>€{reservation.pricing.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('confirmation.taxes')}</span>
                <span>€{reservation.pricing.taxes.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{t('confirmation.total')}</span>
                <span>€{reservation.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {reservation.preferences?.specialRequests && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">{t('confirmation.specialRequests')}</h4>
                <p className="text-sm text-muted-foreground">
                  {reservation.preferences.specialRequests}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('confirmation.nextSteps')}
          </CardTitle>
          <CardDescription>
            {t('confirmation.nextStepsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">{t('confirmation.step1Title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('confirmation.step1Description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">{t('confirmation.step2Title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('confirmation.step2Description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">{t('confirmation.step3Title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('confirmation.step3Description')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {t('confirmation.downloadConfirmation')}
        </Button>
        
        <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {t('confirmation.shareReservation')}
        </Button>
        
        <Button variant="outline" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {t('confirmation.contactSupport')}
        </Button>
        
        {onContinue && (
          <Button onClick={onContinue} className="flex items-center gap-2 ml-auto">
            {t('confirmation.continueBrowsing')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Important Information */}
      <Alert className="mt-6">
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('confirmation.importantNote')}</strong><br />
          {t('confirmation.importantNoteDescription')}
        </AlertDescription>
      </Alert>
    </div>
  );
}