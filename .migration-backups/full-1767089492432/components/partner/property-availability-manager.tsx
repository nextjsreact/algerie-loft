"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, DollarSign, Clock, Save, X, Settings, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Loft, LoftAvailability } from "@/lib/types";

interface PropertyAvailabilityManagerProps {
  property: Loft;
  onClose: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  availability?: LoftAvailability;
  isSelected: boolean;
  isToday: boolean;
}

interface AvailabilityUpdate {
  date: string;
  is_available: boolean;
  price_override?: number;
  minimum_stay: number;
  maximum_stay?: number;
  notes?: string;
}

export function PropertyAvailabilityManager({ property, onClose }: PropertyAvailabilityManagerProps) {
  const t = useTranslations("partner");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<LoftAvailability[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Bulk update form state
  const [bulkUpdate, setBulkUpdate] = useState({
    is_available: true,
    price_override: property.price_per_night || 0,
    minimum_stay: 1,
    maximum_stay: 30,
    notes: '',
  });

  // Advanced bulk operations
  const [showAdvancedBulk, setShowAdvancedBulk] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'update' | 'copy' | 'clear'>('update');

  useEffect(() => {
    loadAvailability();
  }, [property.id, currentDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/partner/properties/${property.id}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load availability');
      }
      
      const data = await response.json();
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error(t('availability.loadError') || 'Error loading availability');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayAvailability = availability.find(a => a.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        availability: dayAvailability,
        isSelected: selectedDates.some(d => d.toDateString() === date.toDateString()),
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (date < new Date()) return; // Can't select past dates
    
    setSelectedDates(prev => {
      const isSelected = prev.some(d => d.toDateString() === date.toDateString());
      if (isSelected) {
        return prev.filter(d => d.toDateString() !== date.toDateString());
      } else {
        return [...prev, date];
      }
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedDates.length === 0) {
      toast.error(t('availability.selectDatesFirst') || 'Please select dates first');
      return;
    }

    try {
      setSaving(true);
      
      const updates: AvailabilityUpdate[] = selectedDates.map(date => ({
        date: date.toISOString().split('T')[0],
        is_available: bulkUpdate.is_available,
        price_override: bulkUpdate.price_override > 0 ? bulkUpdate.price_override : undefined,
        minimum_stay: bulkUpdate.minimum_stay,
        maximum_stay: bulkUpdate.maximum_stay > 0 ? bulkUpdate.maximum_stay : undefined,
        notes: bulkUpdate.notes || undefined,
      }));

      const response = await fetch(`/api/partner/properties/${property.id}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      toast.success(t('availability.updateSuccess') || 'Availability updated successfully');
      setSelectedDates([]);
      loadAvailability();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error(t('availability.updateError') || 'Error updating availability');
    } finally {
      setSaving(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDates([]);
  };

  const getDayClassName = (day: CalendarDay) => {
    let className = "h-10 w-10 flex items-center justify-center text-sm cursor-pointer rounded-md transition-colors ";
    
    if (!day.isCurrentMonth) {
      className += "text-muted-foreground ";
    }
    
    if (day.isToday) {
      className += "bg-primary text-primary-foreground ";
    } else if (day.isSelected) {
      className += "bg-primary/20 text-primary ";
    } else if (day.availability?.is_available === false) {
      className += "bg-red-100 text-red-800 ";
    } else if (day.availability?.price_override) {
      className += "bg-green-100 text-green-800 ";
    } else {
      className += "hover:bg-muted ";
    }
    
    if (day.date < new Date()) {
      className += "opacity-50 cursor-not-allowed ";
    }
    
    return className;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('availability.title') || 'Manage Availability'} - {property.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={getDayClassName(day)}
                          onClick={() => handleDateClick(day.date)}
                        >
                          {day.date.getDate()}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded"></div>
                        <span>{t('availability.legend.today') || 'Today'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary/20 rounded"></div>
                        <span>{t('availability.legend.selected') || 'Selected'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-100 rounded"></div>
                        <span>{t('availability.legend.unavailable') || 'Unavailable'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 rounded"></div>
                        <span>{t('availability.legend.customPrice') || 'Custom Price'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bulk Update Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('availability.bulkUpdate') || 'Bulk Update'}
                </CardTitle>
                {selectedDates.length > 0 && (
                  <Badge variant="secondary">
                    {selectedDates.length} {t('availability.datesSelected') || 'dates selected'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Availability Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">
                    {t('availability.available') || 'Available'}
                  </Label>
                  <Switch
                    id="available"
                    checked={bulkUpdate.is_available}
                    onCheckedChange={(checked) => 
                      setBulkUpdate(prev => ({ ...prev, is_available: checked }))
                    }
                  />
                </div>

                {/* Price Override */}
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {t('availability.customPrice') || 'Custom Price ($)'}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkUpdate.price_override}
                    onChange={(e) => 
                      setBulkUpdate(prev => ({ 
                        ...prev, 
                        price_override: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder={`Default: $${property.price_per_night || 0}`}
                  />
                </div>

                {/* Minimum Stay */}
                <div className="space-y-2">
                  <Label htmlFor="minStay">
                    {t('availability.minimumStay') || 'Minimum Stay (nights)'}
                  </Label>
                  <Input
                    id="minStay"
                    type="number"
                    min="1"
                    value={bulkUpdate.minimum_stay}
                    onChange={(e) => 
                      setBulkUpdate(prev => ({ 
                        ...prev, 
                        minimum_stay: parseInt(e.target.value) || 1 
                      }))
                    }
                  />
                </div>

                {/* Maximum Stay */}
                <div className="space-y-2">
                  <Label htmlFor="maxStay">
                    {t('availability.maximumStay') || 'Maximum Stay (nights)'}
                  </Label>
                  <Input
                    id="maxStay"
                    type="number"
                    min="1"
                    value={bulkUpdate.maximum_stay}
                    onChange={(e) => 
                      setBulkUpdate(prev => ({ 
                        ...prev, 
                        maximum_stay: parseInt(e.target.value) || 30 
                      }))
                    }
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {t('availability.notes') || 'Notes'}
                  </Label>
                  <Input
                    id="notes"
                    value={bulkUpdate.notes}
                    onChange={(e) => 
                      setBulkUpdate(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder={t('availability.notesPlaceholder') || 'Optional notes...'}
                  />
                </div>

                {/* Update Button */}
                <Button
                  onClick={handleBulkUpdate}
                  disabled={selectedDates.length === 0 || saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('availability.updating') || 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('availability.updateSelected') || 'Update Selected Dates'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('availability.quickActions') || 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    const dates = [];
                    for (let d = new Date(today); d <= nextMonth; d.setDate(d.getDate() + 1)) {
                      dates.push(new Date(d));
                    }
                    setSelectedDates(dates);
                  }}
                >
                  {t('availability.selectRestOfMonth') || 'Select Rest of Month'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedDates([])}
                >
                  {t('availability.clearSelection') || 'Clear Selection'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowAdvancedBulk(!showAdvancedBulk)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('availability.advancedOperations') || 'Advanced Operations'}
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Bulk Operations */}
            {showAdvancedBulk && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('availability.advancedOperations') || 'Advanced Operations'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Operation Type */}
                  <div className="space-y-2">
                    <Label>Operation Type</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={bulkOperation === 'update' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBulkOperation('update')}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      <Button
                        variant={bulkOperation === 'copy' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBulkOperation('copy')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant={bulkOperation === 'clear' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBulkOperation('clear')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Copy from Date Range */}
                  {bulkOperation === 'copy' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="copyFromStart">Copy From Start</Label>
                        <Input
                          id="copyFromStart"
                          type="date"
                          placeholder="Start date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="copyFromEnd">Copy From End</Label>
                        <Input
                          id="copyFromEnd"
                          type="date"
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bulk Pattern Operations */}
                  <div className="space-y-2">
                    <Label>Quick Patterns</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select all weekends in current month
                          const today = new Date();
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const lastDay = new Date(year, month + 1, 0).getDate();
                          const weekends = [];
                          
                          for (let day = 1; day <= lastDay; day++) {
                            const date = new Date(year, month, day);
                            if (date.getDay() === 0 || date.getDay() === 6) { // Sunday or Saturday
                              weekends.push(date);
                            }
                          }
                          setSelectedDates(weekends);
                        }}
                      >
                        Select Weekends
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select all weekdays in current month
                          const today = new Date();
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const lastDay = new Date(year, month + 1, 0).getDate();
                          const weekdays = [];
                          
                          for (let day = 1; day <= lastDay; day++) {
                            const date = new Date(year, month, day);
                            if (date.getDay() !== 0 && date.getDay() !== 6) { // Not Sunday or Saturday
                              weekdays.push(date);
                            }
                          }
                          setSelectedDates(weekdays);
                        }}
                      >
                        Select Weekdays
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select next 30 days
                          const today = new Date();
                          const dates = [];
                          for (let i = 0; i < 30; i++) {
                            const date = new Date(today);
                            date.setDate(today.getDate() + i);
                            dates.push(date);
                          }
                          setSelectedDates(dates);
                        }}
                      >
                        Next 30 Days
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select entire current month
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const lastDay = new Date(year, month + 1, 0).getDate();
                          const allDays = [];
                          
                          for (let day = 1; day <= lastDay; day++) {
                            allDays.push(new Date(year, month, day));
                          }
                          setSelectedDates(allDays);
                        }}
                      >
                        Entire Month
                      </Button>
                    </div>
                  </div>

                  {/* Seasonal Pricing Presets */}
                  <div className="space-y-2">
                    <Label>Seasonal Pricing Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePrice = property.price_per_night || 0;
                          setBulkUpdate(prev => ({
                            ...prev,
                            price_override: Math.round(basePrice * 1.25), // +25% for high season
                            notes: 'High season rate'
                          }));
                        }}
                      >
                        High Season (+25%)
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePrice = property.price_per_night || 0;
                          setBulkUpdate(prev => ({
                            ...prev,
                            price_override: Math.round(basePrice * 0.85), // -15% for low season
                            notes: 'Low season rate'
                          }));
                        }}
                      >
                        Low Season (-15%)
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePrice = property.price_per_night || 0;
                          setBulkUpdate(prev => ({
                            ...prev,
                            price_override: Math.round(basePrice * 1.15), // +15% for weekend
                            minimum_stay: 2,
                            notes: 'Weekend premium'
                          }));
                        }}
                      >
                        Weekend Premium (+15%)
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBulkUpdate(prev => ({
                            ...prev,
                            price_override: 0, // Reset to base price
                            minimum_stay: 1,
                            notes: ''
                          }));
                        }}
                      >
                        Reset to Base
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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