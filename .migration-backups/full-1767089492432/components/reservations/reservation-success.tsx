'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Clock,
  Star,
  MessageCircle,
  ArrowRight,
  Bell,
  CreditCard,
  Shield,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ReservationSuccessProps {
  bookingReference: string;
  confirmationCode: string;
  loftName: string;
  loftAddress: string;
  checkInDate: string;
  checkOutDate: string;
  guestEmail: string;
  totalAmount: number;
  currency?: string;
  onViewReservation?: () => void;
  onBookAnother?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function ReservationSuccess({
  bookingReference,
  confirmationCode,
  loftName,
  loftAddress,
  checkInDate,
  checkOutDate,
  guestEmail,
  totalAmount,
  currency = 'EUR',
  onViewReservation,
  onBookAnother,
  onGoHome,
  className
}: ReservationSuccessProps) {
  const t = useTranslations('booking');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const enableNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          toast.success(t('success.notificationsEnabled'));
        } else {
          toast.error(t('success.notificationsError'));
        }
      }
    } catch (error) {
      toast.error(t('success.notificationsError'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={className}>
      {/* Success Header */}
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-lg">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-3">
              {t('success.title')}
            </h1>
            <p className="text-lg text-green-700 mb-6 max-w-2xl mx-auto">
              {t('success.subtitle', { loftName })}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-lg px-6 py-3 border-green-300 text-green-800 bg-white">
                <strong>{t('success.bookingReference')}: {bookingReference}</strong>
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 border-blue-300 text-blue-800 bg-white">
                {t('success.confirmationCode')}: {confirmationCode}
              </Badge>
            </div>

            <Alert className="border-green-200 bg-green-50 max-w-2xl mx-auto">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t('success.emailSent', { email: guestEmail })}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('success.reservationSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">{loftName}</h3>
              <p className="text-sm text-muted-foreground">{loftAddress}</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">{t('success.dates')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(checkInDate)} - {formatDate(checkOutDate)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">{t('success.totalPaid')}</h3>
              <p className="text-sm text-muted-foreground">
                {currency === 'EUR' ? '€' : currency} {totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('success.whatHappensNext')}
          </CardTitle>
          <CardDescription>
            {t('success.whatHappensNextDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('success.step1Title')}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('success.step1Description')}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {t('success.immediate')}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('success.step2Title')}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('success.step2Description')}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {t('success.within24Hours')}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('success.step3Title')}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('success.step3Description')}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {t('success.beforeCheckIn')}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('success.step4Title')}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('success.step4Description')}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {formatDate(checkInDate)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              {t('success.protectionTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('success.protectionDescription')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{t('success.protection1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{t('success.protection2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{t('success.protection3')}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              {t('success.notificationsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('success.notificationsDescription')}
            </p>
            {!notificationsEnabled ? (
              <Button onClick={enableNotifications} variant="outline" size="sm" className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                {t('success.enableNotifications')}
              </Button>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('success.notificationsEnabledMessage')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Support Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('success.needHelp')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Phone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">{t('success.callUs')}</h4>
              <p className="text-sm text-muted-foreground">+213 XXX XXX XXX</p>
              <p className="text-xs text-muted-foreground">{t('success.available24_7')}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">{t('success.emailUs')}</h4>
              <p className="text-sm text-muted-foreground">support@loftalgerie.com</p>
              <p className="text-xs text-muted-foreground">{t('success.responseWithin2Hours')}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">{t('success.liveChat')}</h4>
              <p className="text-sm text-muted-foreground">{t('success.instantSupport')}</p>
              <p className="text-xs text-muted-foreground">{t('success.available9to21')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onViewReservation && (
          <Button onClick={onViewReservation} variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('success.viewReservation')}
          </Button>
        )}
        
        {onBookAnother && (
          <Button onClick={onBookAnother} variant="outline" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            {t('success.bookAnother')}
          </Button>
        )}
        
        {onGoHome && (
          <Button onClick={onGoHome} className="flex items-center gap-2">
            {t('success.goHome')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Final Note */}
      <Alert className="mt-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('success.finalNoteTitle')}</strong><br />
          {t('success.finalNoteDescription')}
        </AlertDescription>
      </Alert>
    </div>
  );
}