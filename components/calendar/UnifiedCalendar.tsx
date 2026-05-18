/**
 * Unified Calendar Component
 * 
 * Affiche un calendrier mensuel avec toutes les réservations Airbnb.
 * Color-coding: bleu foncé (complet), bleu clair (partiel), rouge (conflits).
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Reservation {
  id: string;
  loft_id: string;
  loft_name: string;
  check_in_date: Date;
  check_out_date: Date;
  guest_name?: string;
  is_complete: boolean;
  status: string;
  has_conflict: boolean;
}

interface UnifiedCalendarProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  selectedLoftId?: string;
}

export function UnifiedCalendar({
  reservations,
  onReservationClick,
  selectedLoftId,
}: UnifiedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculs du calendrier
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Filtrer les réservations
  const filteredReservations = selectedLoftId
    ? reservations.filter(r => r.loft_id === selectedLoftId)
    : reservations;

  // Trouver les réservations pour une date donnée
  const getReservationsForDate = (date: Date): Reservation[] => {
    return filteredReservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      // Normaliser les dates (ignorer l'heure)
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizedCheckIn = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
      const normalizedCheckOut = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

      return normalizedDate >= normalizedCheckIn && normalizedDate < normalizedCheckOut;
    });
  };

  // Générer les jours du calendrier
  const calendarDays: (Date | null)[] = [];
  
  // Jours vides avant le premier jour du mois
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Formater le mois et l'année
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(currentDate);

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded" />
          <span>Réservation complète</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 rounded" />
          <span>Réservation partielle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>Conflit</span>
        </div>
      </div>

      {/* Calendrier */}
      <div className="border rounded-lg overflow-hidden">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 bg-muted">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[120px] border-r border-b bg-muted/20"
                />
              );
            }

            const dayReservations = getReservationsForDate(date);
            const hasConflict = dayReservations.some(r => r.has_conflict);

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'min-h-[120px] border-r border-b p-2 relative',
                  isToday(date) && 'bg-blue-50'
                )}
              >
                {/* Numéro du jour */}
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isToday(date) && 'text-blue-600 font-bold'
                  )}
                >
                  {date.getDate()}
                </div>

                {/* Réservations */}
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <button
                      key={reservation.id}
                      onClick={() => onReservationClick(reservation)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-xs truncate transition-opacity hover:opacity-80',
                        reservation.has_conflict
                          ? 'bg-red-500 text-white'
                          : reservation.is_complete
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-300 text-blue-900'
                      )}
                      title={`${reservation.loft_name} - ${reservation.guest_name || 'Guest'}`}
                    >
                      {reservation.loft_name}
                    </button>
                  ))}
                  
                  {/* Indicateur s'il y a plus de réservations */}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayReservations.length - 3} autre(s)
                    </div>
                  )}

                  {/* Indicateur de conflit */}
                  {hasConflict && (
                    <div className="absolute top-1 right-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiques du mois */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold">{filteredReservations.length}</div>
          <div className="text-muted-foreground">Réservations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {filteredReservations.filter(r => r.is_complete).length}
          </div>
          <div className="text-muted-foreground">Complètes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {filteredReservations.filter(r => r.has_conflict).length}
          </div>
          <div className="text-muted-foreground">Conflits</div>
        </div>
      </div>
    </div>
  );
}
