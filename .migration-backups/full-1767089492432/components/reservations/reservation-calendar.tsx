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
import { 
  getBlockedReasonKey, 
  formatBlockedEventTitle, 
  getSafeEventTitle,
  getReservationTranslation 
} from '@/lib/reservations-translations';
import type { 
  Reservation, 
  AvailabilityResource, 
  CalendarEvent, 
  ReservationCalendarProps
} from '@/types/calendar';
import { isReservation, isAvailabilityResource } from '@/types/calendar';

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

// Custom styles for calendar events and cells
const customCalendarStyles = `
  .rbc-day-bg {
    min-height: 140px; /* Increased row height for more space */
  }
  .rbc-event {
    font-size: 14px; /* Increased font size for better readability */
    padding: 6px 8px; /* More padding */
    line-height: 1.6;
    color: #333;
    white-space: normal; /* Allow text to wrap */
  }
  .rbc-month-row {
    min-height: 180px; /* Adjusted month row height for more space */
  }
  .rbc-row-segment {
    padding: 4px; /* Adjusted padding for events */
  }
  .rbc-date-cell {
    padding: 12px; /* Increased padding to date cells */
    color: #555;
  }
  
  /* Specific styles for different types of blocked events */
  .rbc-event-blocked {
    background-color: #a1a1aa !important;
    border-color: #71717a !important;
    font-weight: 500;
    color: white !important;
  }
  
  .rbc-event-maintenance {
    background-color: #f97316 !important; /* Orange-500 - same as availability */
    border-color: #ea580c !important;
    font-weight: 500;
    color: white !important;
  }
  
  .rbc-event-renovation {
    background-color: #3b82f6 !important; /* Blue-500 - distinct color */
    border-color: #2563eb !important;
    font-weight: 500;
    color: white !important;
  }
  
  .rbc-event-personal {
    background-color: #a855f7 !important; /* Purple-500 - same as availability */
    border-color: #9333ea !important;
    font-weight: 500;
    color: white !important;
  }
  
  /* Improved text content styling */
  .rbc-event-content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    line-height: 1.2;
    max-width: 100%;
  }
  
  /* Enhanced text readability */
  .rbc-event {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    word-wrap: break-word;
    hyphens: auto;
  }
  
  /* Better spacing for event text */
  .rbc-event-content {
    display: block;
    width: 100%;
    padding: 2px 0;
  }
  
  /* Improved cell sizing for better content display */
  .rbc-day-bg {
    min-height: 160px; /* Increased for better content visibility */
  }
  
  .rbc-month-row {
    min-height: 200px; /* Increased for better spacing */
  }
  
  /* Better text truncation with tooltip indication */
  .rbc-event-title {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  
  .rbc-event-title.truncated::after {
    content: "...";
    font-weight: bold;
  }
  
  /* Better responsive behavior */
  @media (max-width: 768px) {
    .rbc-event {
      font-size: 11px;
      padding: 3px 5px;
      line-height: 1.3;
    }
    .rbc-day-bg {
      min-height: 140px;
    }
    .rbc-month-row {
      min-height: 160px;
    }
  }
  
  @media (max-width: 480px) {
    .rbc-event {
      font-size: 10px;
      padding: 2px 4px;
      line-height: 1.2;
    }
    .rbc-day-bg {
      min-height: 120px;
    }
    .rbc-month-row {
      min-height: 140px;
    }
  }
  
  /* Hover effects for better UX */
  .rbc-event:hover {
    opacity: 0.9;
    transform: scale(1.02);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  /* Focus styles for accessibility */
  .rbc-event:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .rbc-event {
      border-width: 3px;
      font-weight: 600;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .rbc-event:hover {
      transform: none;
      transition: none;
    }
  }
`;



const locales = {
  'en': enUS,
  'fr': fr,
  'ar': ar,
};

export default function ReservationCalendar({
  loftId,
  onReservationSelect,
  onDateSelect,
  defaultCurrencySymbol,
}: ReservationCalendarProps) {
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');
  const tAvailability = useTranslations('availability');
  const locale = useLocale();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<any[]>([]);
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
    fetchAvailability(); // Call fetchAvailability here
  }, [loftId, date]);

  useEffect(() => {
    // This effect ensures that events are updated when availability changes
    const reservationEvents: CalendarEvent[] = reservations.map((reservation: Reservation) => ({
      id: reservation.id,
      title: `${reservation.guest_name} - ${reservation.lofts.name}`,
      start: new Date(reservation.check_in_date),
      end: new Date(reservation.check_out_date),
      resource: reservation,
      status: reservation.status,
      loftName: reservation.lofts.name,
    }));

    const availabilityEvents: CalendarEvent[] = availability
      .filter(a => !a.is_available)
      .map(a => {
        // Debug logging
        console.log('Processing availability event:', {
          date: a.date,
          blocked_reason: a.blocked_reason,
          loft_name: a.loft_name,
          reservation: a.reservation,
          full_object: a
        });

        // Extract loft name from different possible sources
        const loftName = a.loft_name || a.reservation?.loft_name;
        const loftIdFallback = loftId || 'unknown';
        
        console.log('Extracted loft name:', loftName, 'from loftId:', loftIdFallback);
        
        // For blocked events, show only the loft name (color will indicate the reason)
        let title = loftName;
        
        if (!title) {
          // Enhanced fallback with more debugging info
          console.warn('⚠️ Missing loft name for availability record:', {
            date: a.date,
            loft_id: loftIdFallback,
            blocked_reason: a.blocked_reason,
            raw_loft_data: a.loft_name,
            reservation_loft_data: a.reservation?.loft_name
          });
          
          title = `Loft Inconnu (${loftIdFallback.slice(-8)})`;
        }

        console.log('Generated title:', title);

        // Determine the specific status based on blocked reason
        let eventStatus = 'blocked';
        const reasonKey = getBlockedReasonKey(a.blocked_reason || '');
        if (reasonKey === 'maintenance') {
          eventStatus = 'maintenance';
        } else if (reasonKey === 'renovation') {
          eventStatus = 'renovation';
        } else if (reasonKey === 'personal') {
          eventStatus = 'personal';
        }

        return {
          id: `blocked-${a.date}`,
          title: title,
          start: new Date(a.date),
          end: new Date(a.date),
          resource: a,
          status: eventStatus,
          loftName: loftName,
        };
      });

    setEvents([...reservationEvents, ...availabilityEvents]);
  }, [reservations, availability]);

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
      console.log('reservationsData', data);
      const reservations = data.reservations || [];
      setReservations(reservations);
      
      const reservationEvents: CalendarEvent[] = reservations.map((reservation: Reservation) => ({
        id: reservation.id,
        title: `${reservation.guest_name} - ${reservation.lofts.name}`,
        start: new Date(reservation.check_in_date),
        end: new Date(reservation.check_out_date),
        resource: reservation,
        status: reservation.status,
        loftName: reservation.lofts.name,
      }));

      const availabilityEvents: CalendarEvent[] = availability
        .filter(a => !a.is_available)
        .map(a => {
          // Extract loft name from different possible sources
          const loftName = a.loft_name || a.reservation?.loft_name;
          
          // Use our new utility function to format the title safely
          const title = formatBlockedEventTitle(
            a.blocked_reason,
            loftName,
            locale,
            (key: string) => getReservationTranslation(key, locale)
          );

          // Determine the specific status based on blocked reason
          let eventStatus = 'blocked';
          const reasonKey = getBlockedReasonKey(a.blocked_reason || '');
          if (reasonKey === 'maintenance') {
            eventStatus = 'maintenance';
          } else if (reasonKey === 'renovation') {
            eventStatus = 'renovation';
          } else if (reasonKey === 'personal') {
            eventStatus = 'personal';
          }

          return {
            id: `blocked-${a.date}`,
            title: title,
            start: new Date(a.date),
            end: new Date(a.date),
            resource: a,
            status: eventStatus,
            loftName: loftName,
          };
        });

      setEvents([...reservationEvents, ...availabilityEvents]);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!loftId) {
      setAvailability([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('loft_id', loftId); // loftId is guaranteed to be present here
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      params.append('start_date', format(start, 'yyyy-MM-dd'));
      params.append('end_date', format(end, 'yyyy-MM-dd'));

      console.log('🔍 Fetching availability for loft:', loftId, 'from', format(start, 'yyyy-MM-dd'), 'to', format(end, 'yyyy-MM-dd'));

      const response = await fetch(`/api/availability?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error fetching availability:', response.status, errorText);
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      console.log('📊 Raw availability data received:', data);
      
      // Filter and log blocked dates specifically
      const blockedDates = data.calendar?.filter((item: any) => !item.is_available) || [];
      console.log('🚫 Blocked dates found:', blockedDates);
      
      setAvailability(data.calendar || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (onReservationSelect && 'guest_name' in event.resource) { // Check if it's a Reservation object
      onReservationSelect(event.resource as Reservation);
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
    let className = '';
    
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
      case 'maintenance':
        backgroundColor = '#f97316'; // Orange-500 - Maintenance (same as availability)
        borderColor = '#ea580c';
        className = 'rbc-event-maintenance';
        break;
      case 'renovation':
        backgroundColor = '#3b82f6'; // Blue-500 - Renovation (distinct from personal)
        borderColor = '#2563eb';
        className = 'rbc-event-renovation';
        break;
      case 'personal':
        backgroundColor = '#a855f7'; // Purple-500 - Personal use (same as availability)
        borderColor = '#9333ea';
        className = 'rbc-event-personal';
        break;
      case 'blocked':
      default:
        backgroundColor = '#d1d5db'; // Gray-300 - Blocked/Other (same as availability default)
        borderColor = '#9ca3af';
        className = 'rbc-event-blocked';
        break;
    }

    return {
      className,
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px',
        fontWeight: '500',
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

  // Utility function for intelligent text truncation
  const truncateEventTitle = (title: string, maxLength: number = 25): string => {
    if (title.length <= maxLength) return title;
    
    // Try to break at word boundaries
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  // Function to determine if text needs truncation
  const shouldTruncateTitle = (title: string, maxLength: number = 25): boolean => {
    return title.length > maxLength;
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
          <div className="h-auto mb-4"> {/* Removed fixed height to allow dynamic sizing */}
            <style>{customCalendarStyles}</style>
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
              <span className="text-sm">{t('status.pending')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">{t('status.cancelled')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">{t('status.completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-sm">{tAvailability('blocked')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">{tAvailability('maintenance')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">{tAvailability('renovation')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">{tAvailability('personalUse')}</span>
            </div>
          </div>
          
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('upcoming.title')}</CardTitle>
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
                    <div className="font-medium">{reservation.total_amount} {defaultCurrencySymbol || 'DZD'}</div>
                    <div className="text-sm text-gray-600">
                      {Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} {t('nights')}
                    </div>
                  </div>
                </div>
              ))}
            
            {reservations.filter(r => new Date(r.check_in_date) >= new Date() && r.status !== 'cancelled').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('upcoming.empty')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}