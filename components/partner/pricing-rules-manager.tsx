"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar, DollarSign, Clock, Target, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Loft } from "@/lib/types";
import { 
  PricingRule, 
  PricingRuleFormData, 
  PricingRuleType, 
  PricingAdjustmentType,
  PRICING_RULE_TEMPLATES,
  validatePricingRule,
  formatAdjustmentValue,
  getDayName
} from "@/lib/types/pricing";

interface PricingRulesManagerProps {
  property: Loft;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function PricingRulesManager({ property, onClose }: PricingRulesManagerProps) {
  const t = useTranslations("partner");
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  
  const [formData, setFormData] = useState<PricingRuleFormData>({
    rule_name: '',
    rule_type: 'seasonal',
    adjustment_type: 'percentage',
    adjustment_value: 0,
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    loadPricingRules();
  }, [property.id]);

  const loadPricingRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/properties/${property.id}/pricing-rules`);
      
      if (!response.ok) {
        throw new Error('Failed to load pricing rules');
      }
      
      const data = await response.json();
      setPricingRules(data.pricing_rules || []);
    } catch (error) {
      console.error('Error loading pricing rules:', error);
      toast.error(t('pricing.loadError') || 'Error loading pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      rule_type: 'seasonal',
      adjustment_type: 'percentage',
      adjustment_value: 0,
      priority: 0,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      start_date: rule.start_date || '',
      end_date: rule.end_date || '',
      days_of_week: rule.days_of_week || [],
      minimum_nights: rule.minimum_nights || undefined,
      maximum_nights: rule.maximum_nights || undefined,
      advance_booking_days: rule.advance_booking_days || undefined,
      adjustment_type: rule.adjustment_type,
      adjustment_value: rule.adjustment_value,
      priority: rule.priority,
      is_active: rule.is_active,
      description: rule.description || '',
    });
    setShowForm(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t('pricing.confirmDelete') || 'Are you sure you want to delete this pricing rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/partner/properties/${property.id}/pricing-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pricing rule');
      }

      toast.success(t('pricing.deleteSuccess') || 'Pricing rule deleted successfully');
      loadPricingRules();
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast.error(t('pricing.deleteError') || 'Error deleting pricing rule');
    }
  };

  const handleSubmitForm = async () => {
    const errors = validatePricingRule(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      setSaving(true);
      
      const url = editingRule 
        ? `/api/partner/properties/${property.id}/pricing-rules/${editingRule.id}`
        : `/api/partner/properties/${property.id}/pricing-rules`;
      
      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save pricing rule');
      }

      toast.success(
        editingRule 
          ? t('pricing.updateSuccess') || 'Pricing rule updated successfully'
          : t('pricing.createSuccess') || 'Pricing rule created successfully'
      );
      
      setShowForm(false);
      loadPricingRules();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      toast.error(t('pricing.saveError') || 'Error saving pricing rule');
    } finally {
      setSaving(false);
    }
  };

  const handleUseTemplate = (templateKey: keyof typeof PRICING_RULE_TEMPLATES) => {
    const template = PRICING_RULE_TEMPLATES[templateKey];
    setFormData({
      ...formData,
      ...template,
    });
  };

  const toggleRuleStatus = async (rule: PricingRule) => {
    try {
      const response = await fetch(`/api/partner/properties/${property.id}/pricing-rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rule,
          is_active: !rule.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rule status');
      }

      toast.success(
        rule.is_active 
          ? t('pricing.deactivateSuccess') || 'Rule deactivated'
          : t('pricing.activateSuccess') || 'Rule activated'
      );
      
      loadPricingRules();
    } catch (error) {
      console.error('Error updating rule status:', error);
      toast.error(t('pricing.statusUpdateError') || 'Error updating rule status');
    }
  };

  const getRuleTypeIcon = (type: PricingRuleType) => {
    switch (type) {
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'weekend': return <Clock className="h-4 w-4" />;
      case 'holiday': return <Target className="h-4 w-4" />;
      case 'event': return <Target className="h-4 w-4" />;
      case 'length_of_stay': return <Clock className="h-4 w-4" />;
      case 'advance_booking': return <Calendar className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getRuleTypeColor = (type: PricingRuleType) => {
    switch (type) {
      case 'seasonal': return 'bg-green-100 text-green-800';
      case 'weekend': return 'bg-blue-100 text-blue-800';
      case 'holiday': return 'bg-purple-100 text-purple-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      case 'length_of_stay': return 'bg-indigo-100 text-indigo-800';
      case 'advance_booking': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('pricing.title') || 'Pricing Rules'} - {property.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pricing.description') || 'Manage dynamic pricing rules for seasonal rates, weekend premiums, and discounts'}
              </p>
            </div>
            <Button onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-2" />
              {t('pricing.addRule') || 'Add Rule'}
            </Button>
          </div>

          {/* Pricing Rules List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pricingRules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {t('pricing.noRules') || 'No pricing rules yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('pricing.noRulesDescription') || 'Create pricing rules to implement dynamic pricing for your property'}
                </p>
                <Button onClick={handleCreateRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('pricing.addFirstRule') || 'Add Your First Rule'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingRules.map((rule) => (
                <Card key={rule.id} className={`${!rule.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getRuleTypeColor(rule.rule_type)}>
                            {getRuleTypeIcon(rule.rule_type)}
                            <span className="ml-1 capitalize">{rule.rule_type.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Rule Details */}
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adjustment:</span>
                        <span className="font-medium">
                          {formatAdjustmentValue(rule.adjustment_type, rule.adjustment_value)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority:</span>
                        <span className="font-medium">{rule.priority}</span>
                      </div>

                      {rule.start_date && rule.end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period:</span>
                          <span className="font-medium text-xs">
                            {new Date(rule.start_date).toLocaleDateString()} - {new Date(rule.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {rule.days_of_week && rule.days_of_week.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days:</span>
                          <span className="font-medium text-xs">
                            {rule.days_of_week.map(day => getDayName(day).slice(0, 3)).join(', ')}
                          </span>
                        </div>
                      )}

                      {rule.minimum_nights && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min nights:</span>
                          <span className="font-medium">{rule.minimum_nights}</span>
                        </div>
                      )}

                      {rule.advance_booking_days && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Advance days:</span>
                          <span className="font-medium">{rule.advance_booking_days}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRuleStatus(rule)}
                        className="flex-1"
                      >
                        {rule.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pricing Rule Form Modal */}
          {showForm && (
            <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Quick Templates */}
                  {!editingRule && (
                    <div className="space-y-2">
                      <Label>Quick Templates</Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(PRICING_RULE_TEMPLATES).map(([key, template]) => (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseTemplate(key as keyof typeof PRICING_RULE_TEMPLATES)}
                          >
                            {template.rule_name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule_name">Rule Name *</Label>
                      <Input
                        id="rule_name"
                        value={formData.rule_name}
                        onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                        placeholder="e.g., Summer Season"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule_type">Rule Type *</Label>
                      <Select
                        value={formData.rule_type}
                        onValueChange={(value: PricingRuleType) => setFormData({ ...formData, rule_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="length_of_stay">Length of Stay</SelectItem>
                          <SelectItem value="advance_booking">Advance Booking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Range (for seasonal, holiday, event) */}
                  {(formData.rule_type === 'seasonal' || formData.rule_type === 'holiday' || formData.rule_type === 'event') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date || ''}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date || ''}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Days of Week (for weekend) */}
                  {formData.rule_type === 'weekend' && (
                    <div className="space-y-2">
                      <Label>Days of Week *</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.value}
                            variant={formData.days_of_week?.includes(day.value) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const currentDays = formData.days_of_week || [];
                              const newDays = currentDays.includes(day.value)
                                ? currentDays.filter(d => d !== day.value)
                                : [...currentDays, day.value];
                              setFormData({ ...formData, days_of_week: newDays });
                            }}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stay Requirements (for length_of_stay) */}
                  {formData.rule_type === 'length_of_stay' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minimum_nights">Minimum Nights *</Label>
                        <Input
                          id="minimum_nights"
                          type="number"
                          min="1"
                          value={formData.minimum_nights || ''}
                          onChange={(e) => setFormData({ ...formData, minimum_nights: parseInt(e.target.value) || undefined })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maximum_nights">Maximum Nights</Label>
                        <Input
                          id="maximum_nights"
                          type="number"
                          min="1"
                          value={formData.maximum_nights || ''}
                          onChange={(e) => setFormData({ ...formData, maximum_nights: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Advance Booking (for advance_booking) */}
                  {formData.rule_type === 'advance_booking' && (
                    <div className="space-y-2">
                      <Label htmlFor="advance_booking_days">Advance Booking Days *</Label>
                      <Input
                        id="advance_booking_days"
                        type="number"
                        min="1"
                        value={formData.advance_booking_days || ''}
                        onChange={(e) => setFormData({ ...formData, advance_booking_days: parseInt(e.target.value) || undefined })}
                        placeholder="e.g., 30"
                      />
                    </div>
                  )}

                  {/* Pricing Adjustment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjustment_type">Adjustment Type *</Label>
                      <Select
                        value={formData.adjustment_type}
                        onValueChange={(value: PricingAdjustmentType) => setFormData({ ...formData, adjustment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                          <SelectItem value="override">Override Price</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adjustment_value">
                        Adjustment Value * 
                        {formData.adjustment_type === 'percentage' && ' (%)'}
                        {formData.adjustment_type === 'fixed_amount' && ' ($)'}
                        {formData.adjustment_type === 'override' && ' ($)'}
                      </Label>
                      <Input
                        id="adjustment_value"
                        type="number"
                        step="0.01"
                        value={formData.adjustment_value}
                        onChange={(e) => setFormData({ ...formData, adjustment_value: parseFloat(e.target.value) || 0 })}
                        placeholder={
                          formData.adjustment_type === 'percentage' ? 'e.g., 25 for +25%' :
                          formData.adjustment_type === 'fixed_amount' ? 'e.g., 50 for +$50' :
                          'e.g., 150 for $150/night'
                        }
                      />
                    </div>
                  </div>

                  {/* Priority and Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="0"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        placeholder="Higher number = higher priority"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="is_active">Active</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_active ? 'Rule is active' : 'Rule is inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description for this rule..."
                      rows={3}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitForm} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingRule ? 'Update Rule' : 'Create Rule'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('common.close') || 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}