'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ReservationConfirmation } from './reservation-confirmation';
import { ReservationSuccess } from './reservation-success';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ReservationRequest, Loft, User } from '@/lib/schemas/booking';

interface ConfirmationPageProps {
  reservationId: string;
  userId?: string;
  showSuccessView?: boolean;
  onNavigateHome?: () => void;
  onNavigateToReservations?: () => void;
  onBookAnother?: () => void;
  className?: string;
}

interface ReservationData extends ReservationRequest {
  id: string;
  confirmationCode: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export function ConfirmationPage({
  reservationId,
  userId,
  showSuccessView = false,
  onNavigateHome,
  onNavigateToReservations,
  onBookAnother,
  className
}: ConfirmationPageProps) {
  const t = useTranslations('booking');
  const router = useRouter();
  
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loft, setLoft] = useState<Loft | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadReservationData();
  }, [reservationId, retryCount]);

  const loadReservationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reservation data
      const reservationResponse = await fetch(`/api/reservations/${reservationId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!reservationResponse.ok) {
        if (reservationResponse.status === 404) {
          throw new Error(t('confirmation.errors.reservationNotFound'));
        } else if (reservationResponse.status === 403) {
          throw new Error(t('confirmation.errors.accessDenied'));
        } else {
          throw new Error(t('confirmation.errors.loadingFailed'));
        }
      }

      const reservationData = await reservationResponse.json();
      setReservation(reservationData.reservation);

      // Load loft data
      if (reservationData.reservation.loftId) {
        const loftResponse = await fetch(`/api/lofts/${reservationData.reservation.loftId}`);
        if (loftResponse.ok) {
          const loftData = await loftResponse.json();
          setLoft(loftData.loft);
        }
      }

      // Load user data if userId is provided
      if (userId) {
        const userResponse = await fetch(`/api/users/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }
      }

    } catch (error) {
      console.error('Error loading reservation data:', error);
      setError(error instanceof Error ? error.message : t('confirmation.errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDownloadConfirmation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/download`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservation-${reservation?.bookingReference}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('confirmation.downloadSuccess'));
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading confirmation:', error);
      toast.error(t('confirmation.downloadError'));
      // Fallback to print
      window.print();
    }
  };

  const handleShareReservation = async () => {
    if (!reservation) return;

    const shareData = {
      title: t('confirmation.shareTitle'),
      text: t('confirmation.shareText', { 
        loftName: loft?.name || 'Loft',
        reference: reservation.bookingReference 
      }),
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success(t('confirmation.shareSuccess'));
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast.success(t('confirmation.linkCopied'));
      }
    } catch (error) {
      console.error('Error sharing reservation:', error);
      toast.error(t('confirmation.shareError'));
    }
  };

  const handleContinue = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      router.push('/');
    }
  };

  const handleViewReservation = () => {
    if (onNavigateToReservations) {
      onNavigateToReservations();
    } else {
      router.push(`/reservations/${reservationId}`);
    }
  };

  const handleBookAnother = () => {
    if (onBookAnother) {
      onBookAnother();
    } else {
      router.push('/reservations/new');
    }
  };

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      router.push('/');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">
                {t('confirmation.loading.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('confirmation.loading.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !reservation) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2 text-destructive">
                {t('confirmation.error.title')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error || t('confirmation.error.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t('confirmation.error.retry')}
                </Button>
                <Button onClick={handleGoHome}>
                  {t('confirmation.error.goHome')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success view
  if (showSuccessView) {
    return (
      <div className={className}>
        <ReservationSuccess
          bookingReference={reservation.bookingReference}
          confirmationCode={reservation.confirmationCode}
          loftName={loft?.name || 'Your Loft'}
          loftAddress={loft?.address || ''}
          checkInDate={reservation.checkIn}
          checkOutDate={reservation.checkOut}
          guestEmail={reservation.guestInfo.primaryGuest.email}
          totalAmount={reservation.pricing.total}
          currency={reservation.pricing.currency}
          onViewReservation={handleViewReservation}
          onBookAnother={handleBookAnother}
          onGoHome={handleGoHome}
        />
      </div>
    );
  }

  // Confirmation view
  return (
    <div className={className}>
      <ReservationConfirmation
        reservation={reservation}
        loft={loft!}
        user={user!}
        onContinue={handleContinue}
        onDownloadConfirmation={handleDownloadConfirmation}
        onShareReservation={handleShareReservation}
      />

      {/* Additional Actions */}
      <div className="mt-8 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('confirmation.additionalInfo')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}