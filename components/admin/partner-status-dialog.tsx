'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RefreshCw, Ban, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Partner {
  id: string;
  business_name: string;
  verification_status: string;
}

interface PartnerStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner;
  action: 'approve' | 'reject' | 'reactivate' | 'suspend';
  onSuccess: () => void;
}

export function PartnerStatusDialog({
  open,
  onOpenChange,
  partner,
  action,
  onSuccess
}: PartnerStatusDialogProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const actionConfig = {
    approve: {
      title: 'Approuver le partenaire',
      description: 'Le partenaire pourra accéder à son dashboard et gérer ses lofts.',
      icon: CheckCircle,
      color: 'text-green-600',
      buttonText: 'Approuver',
      buttonVariant: 'default' as const,
      endpoint: '/api/admin/partners/approve'
    },
    reject: {
      title: 'Rejeter le partenaire',
      description: 'Le partenaire sera notifié du rejet. Vous pourrez le réactiver plus tard.',
      icon: XCircle,
      color: 'text-red-600',
      buttonText: 'Rejeter',
      buttonVariant: 'destructive' as const,
      endpoint: '/api/admin/partners/reject'
    },
    reactivate: {
      title: 'Réactiver le partenaire',
      description: 'Le partenaire sera remis en statut "En attente" pour réévaluation.',
      icon: RefreshCw,
      color: 'text-blue-600',
      buttonText: 'Réactiver',
      buttonVariant: 'outline' as const,
      endpoint: '/api/admin/partners/reactivate'
    },
    suspend: {
      title: 'Suspendre le partenaire',
      description: 'Le partenaire perdra temporairement l\'accès à son dashboard.',
      icon: Ban,
      color: 'text-orange-600',
      buttonText: 'Suspendre',
      buttonVariant: 'outline' as const,
      endpoint: '/api/admin/partners/suspend'
    }
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: any = {
        partnerId: partner.id,
        adminNotes: notes
      };

      if (action === 'reject') {
        if (!rejectionReason.trim()) {
          toast.error('Veuillez indiquer une raison de rejet');
          setLoading(false);
          return;
        }
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`Partenaire ${config.buttonText.toLowerCase()} avec succès`);
        onOpenChange(false);
        onSuccess();
        setNotes('');
        setRejectionReason('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${config.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {partner.business_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Raison du rejet *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: Documents incomplets, informations manquantes..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Cette raison sera visible par le partenaire
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-notes">
              Notes administratives (optionnel)
            </Label>
            <Textarea
              id="admin-notes"
              placeholder="Notes internes pour l'équipe admin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Ces notes sont privées et ne seront pas visibles par le partenaire
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                {config.buttonText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
