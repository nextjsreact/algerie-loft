/**
 * Reservation Modal Component
 * 
 * Modal affichant les détails complets d'une réservation.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Mail, Phone, DollarSign, MapPin, AlertTriangle } from 'lucide-react';

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

interface ReservationModalProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationModal({
  reservation,
  open,
  onOpenChange,
}: ReservationModalProps) {
  if (!reservation) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      case 'checked_in':
        return <Badge className="bg-blue-500">Check-in effectué</Badge>;
      case 'checked_out':
        return <Badge variant="secondary">Check-out effectué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'airbnb_ical':
        return <Badge variant="outline">iCal Airbnb</Badge>;
      case 'airbnb_csv':
        return <Badge className="bg-blue-600">CSV Airbnb</Badge>;
      case 'manual':
        return <Badge variant="secondary">Manuel</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const nights = Math.ceil(
    (reservation.check_out_date.getTime() - reservation.check_in_date.getTime()) /
    (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {reservation.loft_name}
          </DialogTitle>
          <DialogDescription>
            Détails de la réservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflit Alert */}
          {reservation.has_conflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">Conflit détecté</div>
                <div className="text-sm text-red-700">
                  Cette réservation chevauche une autre réservation pour ce loft.
                </div>
              </div>
            </div>
          )}

          {/* Status et Source */}
          <div className="flex gap-2">
            {getStatusBadge(reservation.status)}
            {getSourceBadge(reservation.source)}
            {reservation.is_complete ? (
              <Badge className="bg-green-500">Complète</Badge>
            ) : (
              <Badge variant="secondary">Partielle</Badge>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Check-in</div>
                <div className="font-medium">{formatDate(reservation.check_in_date)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Check-out</div>
                <div className="font-medium">{formatDate(reservation.check_out_date)}</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {nights} nuit{nights > 1 ? 's' : ''}
            </div>
          </div>

          <Separator />

          {/* Informations Client */}
          {reservation.is_complete && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations Client
                </h3>
                
                {reservation.guest_name && (
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="font-medium">{reservation.guest_name}</div>
                  </div>
                )}

                {reservation.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`mailto:${reservation.guest_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {reservation.guest_email}
                    </a>
                  </div>
                )}

                {reservation.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${reservation.guest_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {reservation.guest_phone}
                    </a>
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Montant */}
          {reservation.amount && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Montant
                </h3>
                <div className="text-2xl font-bold">
                  {reservation.amount.toFixed(2)} {reservation.currency || 'EUR'}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Informations Techniques */}
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold">Informations Techniques</h3>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>ID Réservation:</div>
              <div className="font-mono text-xs">{reservation.id.substring(0, 8)}...</div>
              
              {reservation.external_id && (
                <>
                  <div>Code Airbnb:</div>
                  <div className="font-mono text-xs">{reservation.external_id}</div>
                </>
              )}
              
              <div>Source:</div>
              <div>{reservation.source}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
