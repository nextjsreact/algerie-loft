'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, fr, ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Add RTL support styles
const rtlStyles = `
  .rtl .rbc-calendar {
    direction: rtl;
  }
  .rtl .rbc-header {
    text-align: right;
  }
  .rtl .rbc-toolbar button {
    margin-left: 0;
    margin-right: 0.25rem;
  }
`;

interface Reservation {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  lofts: {
    name: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Reservation;
  status: string;
}

interface ReservationCalendarProps {
  loftId?: string;
  onReservationSelect?: (reservation: Reservation) => void;
  onDateSelect?: (start: Date, end: Date) => void;
}

const locales = {
  'en': enUS,
  'fr': fr,
  'ar': ar,
};

export default function ReservationCalendar({
  loftId,
  onReservationSelect,
  onDateSelect,
}: ReservationCalendarProps) {
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const getDateFnsLocale = () => {
    const lang = locale as keyof typeof locales;
    return locales[lang] || enUS;
  };

  const localizer = dateFnsLocalizer({
    format: (date: Date, formatStr: string) => format(date, formatStr, { locale: getDateFnsLocale() }),
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { locale: getDateFnsLocale() }),
    getDay,
    locales,
  });

  useEffect(() => {
    fetchReservations();
  }, [loftId]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (loftId) params.append('loft_id', loftId);
      
      const response = await fetch(`/api/reservations?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch reservations: ${response.status}`);
      }
      
      const data = await response.json();
      const reservations = data.reservations || [];
      setReservations(reservations);
      
      const calendarEvents: CalendarEvent[] = reservations.map((reservation: Reservation) => ({
        id: reservation.id,
        title: `${reservation.guest_name} - ${reservation.lofts.name}`,
        start: new Date(reservation.check_in_date),
        end: new Date(reservation.check_out_date),
        resource: reservation,
        status: reservation.status,
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (onReservationSelect) {
      onReservationSelect(event.resource);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (onDateSelect) {
      onDateSelect(start, end);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'pending':
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'completed':
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{tCommon('loading')}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('calendar.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('month')}
                className={view === 'month' ? 'bg-primary text-primary-foreground' : ''}
              >
                {t('calendar.month')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('week')}
                className={view === 'week' ? 'bg-primary text-primary-foreground' : ''}
              >
                {t('calendar.week')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('day')}
                className={view === 'day' ? 'bg-primary text-primary-foreground' : ''}
              >
                {t('calendar.day')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 mb-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              culture={locale}
              messages={{
                next: locale === 'fr' ? 'Suivant' : locale === 'ar' ? 'التالي' : 'Next',
                previous: locale === 'fr' ? 'Précédent' : locale === 'ar' ? 'السابق' : 'Previous',
                today: locale === 'fr' ? 'Aujourd\'hui' : locale === 'ar' ? 'اليوم' : 'Today',
                month: locale === 'fr' ? 'Mois' : locale === 'ar' ? 'شهر' : 'Month',
                week: locale === 'fr' ? 'Semaine' : locale === 'ar' ? 'أسبوع' : 'Week',
                day: locale === 'fr' ? 'Jour' : locale === 'ar' ? 'يوم' : 'Day',
                agenda: locale === 'fr' ? 'Agenda' : locale === 'ar' ? 'جدول الأعمال' : 'Agenda',
                date: locale === 'fr' ? 'Date' : locale === 'ar' ? 'التاريخ' : 'Date',
                time: locale === 'fr' ? 'Heure' : locale === 'ar' ? 'الوقت' : 'Time',
                event: locale === 'fr' ? 'Événement' : locale === 'ar' ? 'حدث' : 'Event',
                noEventsInRange: locale === 'fr' ? 'Aucun événement dans cette plage' : locale === 'ar' ? 'لا توجد أحداث في هذا النطاق' : 'No events in this range',
                allDay: locale === 'fr' ? 'Toute la journée' : locale === 'ar' ? 'طوال اليوم' : 'All Day',
                work_week: locale === 'fr' ? 'Semaine de travail' : locale === 'ar' ? 'أسبوع العمل' : 'Work Week',
                yesterday: locale === 'fr' ? 'Hier' : locale === 'ar' ? 'أمس' : 'Yesterday',
                tomorrow: locale === 'fr' ? 'Demain' : locale === 'ar' ? 'غداً' : 'Tomorrow',
                showMore: (total: number) => locale === 'fr' ? `Afficher plus (${total})` : locale === 'ar' ? `عرض المزيد (${total})` : `Show more (${total})`,
              }}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">{t('status.confirmed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">{t('status.pending', 'En attente')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">{t('status.cancelled', 'Annulé')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">{t('status.completed', 'Terminé')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('upcoming.title', 'Réservations à venir')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reservations
              .filter(r => new Date(r.check_in_date) >= new Date() && r.status !== 'cancelled')
              .slice(0, 5)
              .map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onReservationSelect?.(reservation)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reservation.guest_name}</span>
                      <Badge className={getStatusColor(reservation.status)}>
                        {t(`status.${reservation.status}` as const)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {reservation.lofts.name} • {format(new Date(reservation.check_in_date), 'MMM dd', { locale: getDateFnsLocale() })} - {format(new Date(reservation.check_out_date), 'MMM dd', { locale: getDateFnsLocale() })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{reservation.total_amount} DZD</div>
                    <div className="text-sm text-gray-600">
                      {Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} {t('nights', 'nuits')}
                    </div>
                  </div>
                </div>
              ))}
            
            {reservations.filter(r => new Date(r.check_in_date) >= new Date() && r.status !== 'cancelled').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('upcoming.empty', 'Aucune réservation à venir')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}