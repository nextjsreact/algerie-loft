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
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Partner {
  id: string;
  business_name: string;
  business_type: 'individual' | 'company';
  phone: string;
  email?: string;
  address: string;
  verification_status: string;
  verification_documents: string[];
  created_at: string;
  updated_at: string;
  rejected_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  tax_id?: string;
}

interface PartnerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner;
}

export function PartnerDetailsDialog({
  open,
  onOpenChange,
  partner
}: PartnerDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Détails du Partenaire</DialogTitle>
          <DialogDescription>
            Informations complètes sur le partenaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations Générales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom commercial</p>
                <p className="font-medium">{partner.business_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">
                  {partner.business_type === 'company' ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1" />
                      Entreprise
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Particulier
                    </>
                  )}
                </Badge>
              </div>

              {partner.tax_id && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Numéro fiscal</p>
                  <p className="font-medium">{partner.tax_id}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </h3>
            
            <div className="space-y-3">
              {partner.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{partner.email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.phone}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{partner.address}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statut et vérification */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Statut et Vérification
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
                <Badge variant={
                  partner.verification_status === 'verified' || partner.verification_status === 'approved' 
                    ? 'default' 
                    : partner.verification_status === 'rejected' 
                    ? 'destructive' 
                    : 'secondary'
                }>
                  {partner.verification_status === 'pending' && 'En attente'}
                  {partner.verification_status === 'verified' && 'Vérifié'}
                  {partner.verification_status === 'approved' && 'Approuvé'}
                  {partner.verification_status === 'rejected' && 'Rejeté'}
                  {partner.verification_status === 'suspended' && 'Suspendu'}
                </Badge>
              </div>

              {partner.verification_documents && partner.verification_documents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Documents fournis</p>
                  <div className="space-y-1">
                    {partner.verification_documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raison du rejet si applicable */}
          {partner.verification_status === 'rejected' && partner.rejection_reason && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Raison du Rejet
                </h3>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm">{partner.rejection_reason}</p>
                  {partner.rejected_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Rejeté le {new Date(partner.rejected_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes admin */}
          {partner.admin_notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes Administratives
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{partner.admin_notes}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">
                  {new Date(partner.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière mise à jour</span>
                <span className="font-medium">
                  {new Date(partner.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
