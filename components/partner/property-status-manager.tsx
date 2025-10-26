"use client";

import { useState } from "react";
import { Settings, DollarSign, ToggleLeft, ToggleRight, Save, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Loft, LoftStatus } from "@/lib/types";

interface PropertyStatusManagerProps {
  property: Loft;
  onClose: () => void;
  onUpdate: () => void;
}

interface StatusUpdate {
  status: LoftStatus;
  is_published: boolean;
  price_per_night?: number;
  price_per_month?: number;
  maintenance_notes?: string;
  availability_notes?: string;
}

export function PropertyStatusManager({ property, onClose, onUpdate }: PropertyStatusManagerProps) {
  const t = useTranslations("partner");
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusUpdate>({
    status: property.status,
    is_published: false, // Will be loaded from API
    price_per_night: property.price_per_night || undefined,
    price_per_month: property.price_per_month || undefined,
    maintenance_notes: '',
    availability_notes: '',
  });

  const handleStatusChange = (newStatus: LoftStatus) => {
    setStatusData(prev => ({
      ...prev,
      status: newStatus,
      // Auto-unpublish if setting to maintenance
      is_published: newStatus === 'maintenance' ? false : prev.is_published,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/partner/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property status');
      }

      toast.success(t('properties.statusUpdateSuccess') || 'Property status updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t('properties.statusUpdateError') || 'Error updating property status'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: LoftStatus) => {
    const statusConfig = {
      available: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: t('properties.status.available') || 'Available',
        description: t('properties.status.availableDescription') || 'Property is ready for bookings',
        icon: '✅',
      },
      occupied: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: t('properties.status.occupied') || 'Occupied',
        description: t('properties.status.occupiedDescription') || 'Property is currently occupied',
        icon: '🏠',
      },
      maintenance: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: t('properties.status.maintenance') || 'Maintenance',
        description: t('properties.status.maintenanceDescription') || 'Property is under maintenance',
        icon: '🔧',
      },
    };

    return statusConfig[status] || statusConfig.available;
  };

  const currentStatusInfo = getStatusInfo(statusData.status);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('properties.statusManager') || 'Property Status & Settings'} - {property.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('properties.currentStatus') || 'Current Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-3 p-4 rounded-lg ${currentStatusInfo.bgColor}`}>
                <span className="text-2xl">{currentStatusInfo.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${currentStatusInfo.color}`}>
                    {currentStatusInfo.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStatusInfo.description}
                  </p>
                </div>
                <Badge variant={statusData.is_published ? "default" : "secondary"}>
                  {statusData.is_published 
                    ? t('properties.published') || 'Published'
                    : t('properties.unpublished') || 'Unpublished'
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('properties.statusControls') || 'Status Controls'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Selection */}
              <div className="space-y-2">
                <Label>{t('properties.propertyStatus') || 'Property Status'}</Label>
                <Select
                  value={statusData.status}
                  onValueChange={(value: LoftStatus) => handleStatusChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        {t('properties.status.available') || 'Available'}
                      </div>
                    </SelectItem>
                    <SelectItem value="occupied">
                      <div className="flex items-center gap-2">
                        <span>🏠</span>
                        {t('properties.status.occupied') || 'Occupied'}
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <div className="flex items-center gap-2">
                        <span>🔧</span>
                        {t('properties.status.maintenance') || 'Maintenance'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {t('properties.publishProperty') || 'Publish Property'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('properties.publishDescription') || 'Make this property visible to clients'}
                  </p>
                </div>
                <Switch
                  checked={statusData.is_published}
                  onCheckedChange={(checked) => 
                    setStatusData(prev => ({ ...prev, is_published: checked }))
                  }
                  disabled={statusData.status === 'maintenance'}
                />
              </div>

              {/* Maintenance Warning */}
              {statusData.status === 'maintenance' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('properties.maintenanceWarning') || 
                      'Properties under maintenance are automatically unpublished and cannot accept new bookings.'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Pricing Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('properties.pricingControls') || 'Pricing Controls'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerNight">
                    {t('properties.pricePerNight') || 'Price per Night ($)'}
                  </Label>
                  <Input
                    id="pricePerNight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={statusData.price_per_night || ''}
                    onChange={(e) => 
                      setStatusData(prev => ({ 
                        ...prev, 
                        price_per_night: parseFloat(e.target.value) || undefined 
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerMonth">
                    {t('properties.pricePerMonth') || 'Price per Month ($)'}
                  </Label>
                  <Input
                    id="pricePerMonth"
                    type="number"
                    min="0"
                    step="0.01"
                    value={statusData.price_per_month || ''}
                    onChange={(e) => 
                      setStatusData(prev => ({ 
                        ...prev, 
                        price_per_month: parseFloat(e.target.value) || undefined 
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('properties.notes') || 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusData.status === 'maintenance' && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceNotes">
                    {t('properties.maintenanceNotes') || 'Maintenance Notes'}
                  </Label>
                  <Textarea
                    id="maintenanceNotes"
                    value={statusData.maintenance_notes || ''}
                    onChange={(e) => 
                      setStatusData(prev => ({ ...prev, maintenance_notes: e.target.value }))
                    }
                    placeholder={t('properties.maintenanceNotesPlaceholder') || 'Describe the maintenance work...'}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="availabilityNotes">
                  {t('properties.availabilityNotes') || 'Availability Notes'}
                </Label>
                <Textarea
                  id="availabilityNotes"
                  value={statusData.availability_notes || ''}
                  onChange={(e) => 
                    setStatusData(prev => ({ ...prev, availability_notes: e.target.value }))
                  }
                  placeholder={t('properties.availabilityNotesPlaceholder') || 'Special instructions or notes for guests...'}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.saving') || 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('properties.saveChanges') || 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}