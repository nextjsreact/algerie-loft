/**
 * Unified Calendar Page
 * 
 * Page principale du calendrier unifié affichant toutes les réservations Airbnb.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UnifiedCalendar } from '@/components/calendar/UnifiedCalendar';
import { ReservationModal } from '@/components/calendar/ReservationModal';
import { Loader2, RefreshCw, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';

interface Reservation {
  id: string;
  loft_id: string;
  loft_name: string;
  check_in_date: Date;
  check_out_date: Date;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  amount?: number;
  currency?: string;
  status: string;
  source: string;
  is_complete: boolean;
  has_conflict: boolean;
  external_id?: string;
}

interface Loft {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [selectedLoftId, setSelectedLoftId] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les réservations
      const reservationsResponse = await fetch('/api/bookings/calendar', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!reservationsResponse.ok) {
        throw new Error('Erreur lors de la récupération des réservations');
      }

      const reservationsData = await reservationsResponse.json();

      // Convertir les dates string en Date objects
      const parsedReservations = reservationsData.reservations.map((r: any) => ({
        ...r,
        check_in_date: new Date(r.check_in_date),
        check_out_date: new Date(r.check_out_date),
      }));

      setReservations(parsedReservations);

      // Récupérer les lofts
      const loftsResponse = await fetch('/api/lofts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (loftsResponse.ok) {
        const loftsData = await loftsResponse.json();
        setLofts(loftsData.lofts || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du déclenchement de la synchronisation');
      }

      // Attendre 2 secondes puis rafraîchir
      setTimeout(() => {
        fetchData();
        setSyncing(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const conflicts = reservations.filter(r => r.has_conflict);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Calendrier Unifié
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de toutes les réservations Airbnb
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleSyncNow} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflits détectés</AlertTitle>
          <AlertDescription>
            {conflicts.length} réservation(s) en conflit. Cliquez sur les réservations en rouge
            pour voir les détails.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Loft</label>
              <Select value={selectedLoftId} onValueChange={setSelectedLoftId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lofts</SelectItem>
                  {lofts.map((loft) => (
                    <SelectItem key={loft.id} value={loft.id}>
                      {loft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <UnifiedCalendar
              reservations={reservations}
              onReservationClick={setSelectedReservation}
              selectedLoftId={selectedLoftId === 'all' ? undefined : selectedLoftId}
            />
          )}
        </CardContent>
      </Card>

      {/* Reservation Modal */}
      <ReservationModal
        reservation={selectedReservation}
        open={!!selectedReservation}
        onOpenChange={(open) => !open && setSelectedReservation(null)}
      />
    </div>
  );
}
