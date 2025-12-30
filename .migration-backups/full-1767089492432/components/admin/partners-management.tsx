'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Eye,
  AlertCircle,
  Ban
} from 'lucide-react';
import { PartnerStatusDialog } from './partner-status-dialog';
import { PartnerDetailsDialog } from './partner-details-dialog';

interface Partner {
  id: string;
  user_id: string;
  business_name: string;
  business_type: 'individual' | 'company';
  phone: string;
  email?: string;
  address: string;
  verification_status: 'pending' | 'verified' | 'approved' | 'rejected' | 'suspended';
  verification_documents: string[];
  created_at: string;
  updated_at: string;
  rejected_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export function PartnersManagement() {
  const t = useTranslations();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'reactivate' | 'suspend'>('approve');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Erreur chargement partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (partner: Partner, action: typeof actionType) => {
    setSelectedPartner(partner);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleViewDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: Partner['verification_status']) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      verified: { label: 'Vérifié', variant: 'default' as const, icon: CheckCircle },
      approved: { label: 'Approuvé', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeté', variant: 'destructive' as const, icon: XCircle },
      suspended: { label: 'Suspendu', variant: 'outline' as const, icon: Ban }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionButtons = (partner: Partner) => {
    switch (partner.verification_status) {
      case 'pending':
        return (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAction(partner, 'approve')}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAction(partner, 'reject')}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
          </>
        );
      
      case 'rejected':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(partner, 'reactivate')}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Réactiver
          </Button>
        );
      
      case 'verified':
      case 'approved':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(partner, 'suspend')}
            className="flex items-center gap-1"
          >
            <Ban className="h-4 w-4" />
            Suspendre
          </Button>
        );
      
      case 'suspended':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(partner, 'reactivate')}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Réactiver
          </Button>
        );
      
      default:
        return null;
    }
  };

  const filterPartners = (status?: Partner['verification_status']) => {
    if (!status) return partners;
    return partners.filter(p => p.verification_status === status);
  };

  const PartnerCard = ({ partner }: { partner: Partner }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{partner.business_name}</CardTitle>
            <CardDescription className="mt-1">
              {partner.business_type === 'company' ? 'Entreprise' : 'Particulier'}
            </CardDescription>
          </div>
          {getStatusBadge(partner.verification_status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              📧 {partner.email || 'Non renseigné'}
            </p>
            <p className="text-muted-foreground">
              📱 {partner.phone}
            </p>
            <p className="text-muted-foreground">
              📍 {partner.address}
            </p>
            <p className="text-muted-foreground text-xs">
              📅 Créé le {new Date(partner.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {partner.verification_status === 'rejected' && partner.rejection_reason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Raison du rejet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {partner.rejection_reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewDetails(partner)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Détails
            </Button>
            {getActionButtons(partner)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des partenaires...</p>
        </div>
      </div>
    );
  }

  const pendingCount = filterPartners('pending').length;
  const verifiedCount = filterPartners('verified').length + filterPartners('approved').length;
  const rejectedCount = filterPartners('rejected').length;
  const suspendedCount = filterPartners('suspended').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Partenaires</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les demandes de partenariat et les statuts des partenaires
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vérifiés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejetés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{suspendedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tous ({partners.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Vérifiés ({verifiedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejetés ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspendus ({suspendedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterPartners('pending').map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...filterPartners('verified'), ...filterPartners('approved')].map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterPartners('rejected').map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suspended" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterPartners('suspended').map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedPartner && (
        <>
          <PartnerStatusDialog
            open={actionDialogOpen}
            onOpenChange={setActionDialogOpen}
            partner={selectedPartner}
            action={actionType}
            onSuccess={loadPartners}
          />
          <PartnerDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            partner={selectedPartner}
          />
        </>
      )}
    </div>
  );
}
