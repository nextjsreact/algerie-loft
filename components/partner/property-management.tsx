"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Eye, ToggleLeft, ToggleRight, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PropertyForm } from "./property-form";
import { PropertyAvailabilityManager } from "./property-availability-manager";
import { PropertyStatusManager } from "./property-status-manager";
import { PricingRulesManager } from "./pricing-rules-manager";
import type { Loft, LoftStatus } from "@/lib/types";

interface PartnerProperty extends Loft {
  bookings_count?: number;
  total_earnings?: number;
  occupancy_rate?: number;
  average_rating?: number;
  is_published?: boolean;
}

interface PropertyManagementProps {
  userId: string;
}

export function PropertyManagement({ userId }: PropertyManagementProps) {
  const t = useTranslations("partner");
  const [properties, setProperties] = useState<PartnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PartnerProperty | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showPricingRules, setShowPricingRules] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadProperties();
  }, [userId]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/properties?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load properties');
      }
      
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error(t('properties.loadError') || 'Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditProperty = (property: PartnerProperty) => {
    setSelectedProperty(property);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleManageAvailability = (property: PartnerProperty) => {
    setSelectedProperty(property);
    setShowAvailability(true);
  };

  const handleManageStatus = (property: PartnerProperty) => {
    setSelectedProperty(property);
    setShowStatusManager(true);
  };

  const handleManagePricing = (property: PartnerProperty) => {
    setSelectedProperty(property);
    setShowPricingRules(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedProperty(null);
    loadProperties();
    toast.success(
      formMode === 'create' 
        ? t('properties.createSuccess') || 'Property created successfully'
        : t('properties.updateSuccess') || 'Property updated successfully'
    );
  };

  const togglePropertyStatus = async (property: PartnerProperty) => {
    try {
      const newStatus = property.is_published ? false : true;
      
      const response = await fetch(`/api/partner/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_published: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update property status');
      }

      // Update local state
      setProperties(prev => 
        prev.map(p => 
          p.id === property.id 
            ? { ...p, is_published: newStatus }
            : p
        )
      );

      toast.success(
        newStatus 
          ? t('properties.publishSuccess') || 'Property published successfully'
          : t('properties.unpublishSuccess') || 'Property unpublished successfully'
      );
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error(t('properties.statusUpdateError') || 'Error updating property status');
    }
  };

  const getStatusBadge = (status: LoftStatus) => {
    const statusConfig = {
      available: { variant: 'default' as const, label: t('properties.status.available') || 'Available' },
      occupied: { variant: 'secondary' as const, label: t('properties.status.occupied') || 'Occupied' },
      maintenance: { variant: 'destructive' as const, label: t('properties.status.maintenance') || 'Maintenance' },
    };

    const config = statusConfig[status] || statusConfig.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('properties.loading') || 'Loading properties...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="space-y-3">
          <h1 className="text-xl font-bold">{t('properties.title') || 'Property Management'}</h1>
          <p className="text-muted-foreground text-sm">
            {t('properties.description') || 'Manage your properties, availability, and settings'}
          </p>
          <Button onClick={handleCreateProperty} className="w-full h-12">
            <Plus className="h-4 w-4 mr-2" />
            {t('properties.addProperty') || 'Add Property'}
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('properties.title') || 'Property Management'}</h1>
          <p className="text-muted-foreground">
            {t('properties.description') || 'Manage your properties, availability, and settings'}
          </p>
        </div>
        <Button onClick={handleCreateProperty}>
          <Plus className="h-4 w-4 mr-2" />
          {t('properties.addProperty') || 'Add Property'}
        </Button>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground mb-4">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {t('properties.noProperties') || 'No properties yet'}
              </h3>
              <p>
                {t('properties.noPropertiesDescription') || 'Start by adding your first property to the platform'}
              </p>
            </div>
            <Button onClick={handleCreateProperty}>
              <Plus className="h-4 w-4 mr-2" />
              {t('properties.addFirstProperty') || 'Add Your First Property'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{property.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {property.address}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePropertyStatus(property)}
                    className="ml-2"
                  >
                    {property.is_published ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status and Price */}
                <div className="flex justify-between items-center">
                  {getStatusBadge(property.status)}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {t('properties.pricePerNight') || 'Per night'}
                    </p>
                    <p className="font-semibold">
                      {property.price_per_night ? `$${property.price_per_night}` : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('properties.bookings') || 'Bookings'}</p>
                    <p className="font-medium">{property.bookings_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('properties.earnings') || 'Earnings'}</p>
                    <p className="font-medium">${property.total_earnings || 0}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProperty(property)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('properties.edit') || 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageAvailability(property)}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {t('properties.availability') || 'Calendar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagePricing(property)}
                    title="Pricing Rules"
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      {showForm && (
        <PropertyForm
          property={selectedProperty}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* Availability Manager Modal */}
      {showAvailability && selectedProperty && (
        <PropertyAvailabilityManager
          property={selectedProperty}
          onClose={() => {
            setShowAvailability(false);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* Status Manager Modal */}
      {showStatusManager && selectedProperty && (
        <PropertyStatusManager
          property={selectedProperty}
          onClose={() => {
            setShowStatusManager(false);
            setSelectedProperty(null);
          }}
          onUpdate={loadProperties}
        />
      )}

      {/* Pricing Rules Manager Modal */}
      {showPricingRules && selectedProperty && (
        <PricingRulesManager
          property={selectedProperty}
          onClose={() => {
            setShowPricingRules(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
}