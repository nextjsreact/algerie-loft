'use client';

import { useState, useEffect, useTransition, useActionState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { Loader2, Calendar, Users, CreditCard, CheckCircle, AlertCircle, Star, Building2, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { createReservation } from '@/lib/actions/reservations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types/customer';

interface Loft {
  id: string;
  name: string;
  price_per_night: number;
  max_guests: number;
}

interface PricingData {
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_amount: number;
}

interface AvailabilityData {
  available: boolean;
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  nights: number;
  pricing: PricingData | null;
}

interface ReservationFormHybridProps {
  initialLoftId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSuccess?: (reservation: any) => void;
  onCancel?: () => void;
  defaultCurrencySymbol?: string;
}

export default function ReservationFormHybrid({
  initialLoftId,
  initialCheckIn,
  initialCheckOut,
  onSuccess,
  onCancel,
  defaultCurrencySymbol,
}: ReservationFormHybridProps) {
  const t = useTranslations('reservations');
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form state management
  const [selectedLoft, setSelectedLoft] = useState(initialLoftId || '');
  const [checkInDate, setCheckInDate] = useState(initialCheckIn || '');
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || '');
  const [guestCount, setGuestCount] = useState(1);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestNationality, setGuestNationality] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Pricing state
  const [basePriceInput, setBasePriceInput] = useState<number | ''>('');
  const [cleaningFeeInput, setCleaningFeeInput] = useState<number | ''>('');
  const [serviceFeeInput, setServiceFeeInput] = useState<number | ''>('');
  const [taxesInput, setTaxesInput] = useState<number | ''>('');
  const [totalAmountInput, setTotalAmountInput] = useState<number | ''>('');

  // Server action state
  const [state, formAction] = useActionState(createReservation, null);

  const selectedLoftData = lofts.find(l => l.id === selectedLoft);
  const nights = availabilityData?.nights || 0;

  useEffect(() => {
    fetchLofts();
  }, []);

  useEffect(() => {
    if (selectedLoft && checkInDate && checkOutDate) {
      checkAvailabilityAndPricing();
    }
  }, [selectedLoft, checkInDate, checkOutDate, guestCount]);

  useEffect(() => {
    if (availabilityData?.pricing) {
      setBasePriceInput(availabilityData.pricing.base_price);
      setCleaningFeeInput(availabilityData.pricing.cleaning_fee);
      setServiceFeeInput(availabilityData.pricing.service_fee);
      setTaxesInput(availabilityData.pricing.taxes);
      setTotalAmountInput(availabilityData.pricing.total_amount); // This will be overwritten by the calculation effect
    } else {
      let currentBasePrice = 0;
      if (selectedLoftData) {
        currentBasePrice = selectedLoftData.price_per_night || 0;
        const calculatedNights = (checkInDate && checkOutDate) ?
          Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        if (calculatedNights > 0) {
          currentBasePrice *= calculatedNights;
        }
      }

      setBasePriceInput(currentBasePrice);
      setCleaningFeeInput(0);
      setServiceFeeInput(0);
      setTaxesInput(0);
      setTotalAmountInput(0); // Initialize to 0, will be updated by calculation effect
    }
  }, [availabilityData, selectedLoftData, checkInDate, checkOutDate]);

  // Calculate total amount whenever its components change
  useEffect(() => {
    const total = (parseFloat(String(basePriceInput)) || 0) +
                  (parseFloat(String(cleaningFeeInput)) || 0) +
                  (parseFloat(String(serviceFeeInput)) || 0) +
                  (parseFloat(String(taxesInput)) || 0);
    setTotalAmountInput(total);
  }, [basePriceInput, cleaningFeeInput, serviceFeeInput, taxesInput]);

  // Handle successful reservation creation
  useEffect(() => {
    if (state?.success && state.data) {
      onSuccess?.(state.data);
    }
  }, [state, onSuccess]);

  const fetchLofts = async () => {
    try {
      const response = await fetch('/api/lofts');
      if (!response.ok) throw new Error('Failed to fetch lofts');
      const data = await response.json();
      setLofts(data.lofts || []);
    } catch (error) {
      console.error('Error fetching lofts:', error);
    }
  };

  const checkAvailabilityAndPricing = async () => {
    if (!selectedLoft || !checkInDate || !checkOutDate) return;
    
    try {
      setCheckingAvailability(true);
      const params = new URLSearchParams({
        loft_id: selectedLoft,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_count: guestCount.toString(),
      });

      const response = await fetch(`/api/availability?${params}`);
      if (!response.ok) throw new Error('Failed to check availability');
      
      const data: AvailabilityData = await response.json();
      setAvailabilityData(data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityData(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const fetchCustomer = useCallback(async (query: string, type: 'email' | 'phone') => {
    setIsSearchingCustomer(true);
    setSearchAttempted(true);
    
    try {
      const params = new URLSearchParams({ [type]: query });
      const response = await fetch(`/api/customers/search?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error fetching customer:', errorData.error);
        setFoundCustomer(null);
        // Clear fields if no customer found
        if (type === 'email') {
          setGuestPhone('');
          setGuestName('');
          setGuestNationality('');
        } else if (type === 'phone') {
          setGuestEmail('');
          setGuestName('');
          setGuestNationality('');
        }
      } else {
        const data = await response.json();
        const customer = data.customer;
        setFoundCustomer(customer);
        if (customer) {
          setGuestName(`${customer.first_name || ''} ${customer.last_name || ''}`);
          setGuestEmail(customer.email || '');
          setGuestPhone(customer.phone || '');
          setGuestNationality(customer.nationality || '');
        } else {
          // Only clear fields if no customer was found after a search (and not just initially empty)
          // Also, only clear the field that was NOT used for the search
          if (type === 'email') {
            setGuestPhone(''); // Clear phone if email not found
            setGuestName('');
            setGuestNationality('');
          } else if (type === 'phone') {
            setGuestEmail(''); // Clear email if phone not found
            setGuestName('');
            setGuestNationality('');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setFoundCustomer(null);
      // Clear fields on error
      if (type === 'email') {
        setGuestPhone('');
        setGuestName('');
        setGuestNationality('');
      } else if (type === 'phone') {
        setGuestEmail('');
        setGuestName('');
        setGuestNationality('');
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  const handleSubmit = (formData: FormData) => {
    // Validate required fields before submission
    if (!selectedLoft || !checkInDate || !checkOutDate || checkInDate === '' || checkOutDate === '') {
      console.error('Missing required fields:', { selectedLoft, checkInDate, checkOutDate });
      return;
    }

    if (!availabilityData?.available) {
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Calendar className="h-6 w-6" />
            </div>
            {t('form.title')}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
              {t('form.badge')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form action={handleSubmit} className="space-y-6">
            {/* Hidden fields for server action */}
            <input type="hidden" name="loft_id" value={selectedLoft} />
            <input type="hidden" name="guest_count" value={guestCount} />
            <input type="hidden" name="check_in_date" value={checkInDate} />
            <input type="hidden" name="check_out_date" value={checkOutDate} />
            <input type="hidden" name="guest_email" value={guestEmail} />
            <input type="hidden" name="guest_phone" value={guestPhone} />
            <input type="hidden" name="guest_name" value={guestName} />
            <input type="hidden" name="guest_nationality" value={guestNationality} />
            <input type="hidden" name="base_price" value={String(basePriceInput)} />
            <input type="hidden" name="cleaning_fee" value={String(cleaningFeeInput)} />
            <input type="hidden" name="service_fee" value={String(serviceFeeInput)} />
            <input type="hidden" name="taxes" value={String(taxesInput)} />
            <input type="hidden" name="total_amount" value={String(totalAmountInput)} />

            {/* Display server action errors */}
            {state?.error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-1">{t('form.errorCreatingReservation')}</div>
                  {state.error}
                  {state.details && (
                    <ul className="mt-3 space-y-1">
                      {state.details.map((detail: string, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-600 rounded-full" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Display success message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-medium">{t('form.reservationSuccess')}</div>
                  <div className="text-sm mt-1">{t('form.confirmationMessage')}</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Property & Guest Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{t('form.propertyAndGuestDetails')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="loft_select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    {t('form.loft')}
                  </Label>
                  <Select
                    value={selectedLoft}
                    onValueChange={setSelectedLoft}
                    disabled={!!initialLoftId}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder={t('form.selectLoft')} />
                    </SelectTrigger>
                    <SelectContent>
                      {lofts.map((loft) => (
                        <SelectItem key={loft.id} value={loft.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{loft.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {loft.price_per_night} {defaultCurrencySymbol || 'DZD'}/night
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_count_select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {t('form.guestCount')}
                  </Label>
                  <Select
                    value={guestCount.toString()}
                    onValueChange={(value) => setGuestCount(parseInt(value))}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedLoftData?.max_guests || 8 }, (_, i) => i + 1).map((count) => (
                        <SelectItem key={count} value={count.toString()} className="py-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            {count} {count === 1 ? t('form.guest') : t('form.guests')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{t('form.stayDates')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="check_in" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    {t('form.checkIn')}
                  </Label>
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    placeholder="jj/mm/aaaa"
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="check_out" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {t('form.checkOut')}
                  </Label>
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate ? format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    placeholder="jj/mm/aaaa"
                    className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            {/* Real-time Availability Status (API-powered) */}
            {checkingAvailability && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {t('form.checkingAvailability')}
                </AlertDescription>
              </Alert>
            )}
            {availabilityData && !availabilityData.available && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('form.notAvailable')}
                </AlertDescription>
              </Alert>
            )}
            {availabilityData?.available && availabilityData.pricing && (
              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">{t('form.available')}</h4>
                        <p className="text-sm text-green-600">Perfect! Your selected dates are available for booking.</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 rounded-lg p-4 space-y-3">
                      <h5 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <Label htmlFor="base_price" className="text-gray-600">{t('form.basePrice')} ({nights} nights)</Label>
                          <Input
                            type="number"
                            name="base_price_input"
                            value={String(basePriceInput)}
                            onChange={(e) => setBasePriceInput(parseFloat(e.target.value))}
                            className="w-32 text-right"
                            disabled={!availabilityData?.available}
                          />
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label htmlFor="cleaning_fee" className="text-gray-600">{t('form.cleaningFee')}</Label>
                          <Input
                            type="number"
                            name="cleaning_fee_input"
                            value={String(cleaningFeeInput)}
                            onChange={(e) => setCleaningFeeInput(parseFloat(e.target.value))}
                            className="w-32 text-right"
                            disabled={!availabilityData?.available}
                          />
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label htmlFor="service_fee" className="text-gray-600">{t('form.serviceFee')}</Label>
                          <Input
                            type="number"
                            name="service_fee_input"
                            value={String(serviceFeeInput)}
                            onChange={(e) => setServiceFeeInput(parseFloat(e.target.value))}
                            className="w-32 text-right"
                            disabled={!availabilityData?.available}
                          />
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label htmlFor="taxes" className="text-gray-600">{t('form.taxes')}</Label>
                          <Input
                            type="number"
                            name="taxes_input"
                            value={String(taxesInput)}
                            onChange={(e) => setTaxesInput(parseFloat(e.target.value))}
                            className="w-32 text-right"
                            disabled={!availabilityData?.available}
                          />
                        </div>
                        <hr className="my-3" />
                        <div className="flex justify-between items-center py-2 bg-green-100 rounded-lg px-3">
                          <Label htmlFor="total_amount" className="font-semibold text-green-800">{t('form.total')}</Label>
                          <Input
                            type="number"
                            name="total_amount_input"
                            value={String(totalAmountInput)}
                            className="w-32 text-right text-xl font-bold text-green-800"
                            disabled={!availabilityData?.available}
                            readOnly // Make it read-only
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{t('form.guestInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="guest_email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    {t('form.guestEmail')}
                  </Label>
                  <div className="relative">
                    <Input
                      type="email"
                      name="guest_email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setFoundCustomer(null);
                        setSearchAttempted(false);
                      }}
                      onBlur={() => {
                        if (guestEmail && !foundCustomer) {
                          fetchCustomer(guestEmail, 'email');
                        }
                      }}
                      required
                      disabled={isSearchingCustomer || !!(foundCustomer && foundCustomer.email === guestEmail)}
                      className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                      placeholder={t('form.emailPlaceholder')}
                    />
                    {isSearchingCustomer && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                    {searchAttempted && !foundCustomer && guestEmail && !isSearchingCustomer && (
                      <Badge variant="destructive" className="absolute right-3 top-1/2 -translate-y-1/2">Not Found</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    {t('form.guestPhone')}
                  </Label>
                  <div className="relative">
                    <Input
                      name="guest_phone"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        if (!foundCustomer) setSearchAttempted(false);
                      }}
                      onBlur={() => {
                        if (guestPhone && !foundCustomer) {
                          fetchCustomer(guestPhone, 'phone');
                        }
                      }}
                      required
                      disabled={isSearchingCustomer || !!(foundCustomer && foundCustomer.phone === guestPhone)}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                      placeholder={t('form.phonePlaceholder')}
                    />
                    {isSearchingCustomer && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                    {searchAttempted && !foundCustomer && guestPhone && !isSearchingCustomer && (
                      <Badge variant="destructive" className="absolute right-3 top-1/2 -translate-y-1/2">Not Found</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {t('form.guestName')}
                  </Label>
                  <Input
                    name="guest_name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={t('form.fullNamePlaceholder')}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_nationality" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    {t('form.guestNationality')}
                  </Label>
                  <Input
                    name="guest_nationality"
                    value={guestNationality}
                    onChange={(e) => setGuestNationality(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder={t('form.nationalityPlaceholder')}
                  />
                </div>
              </div>

              {foundCustomer && (
                <Alert className="border-blue-200 bg-blue-50/80 backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="font-medium">Customer Found!</div>
                    <div className="text-sm mt-1">Pre-filled details for {foundCustomer.first_name} {foundCustomer.last_name}.</div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="special_requests" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  {t('form.specialRequests')}
                </Label>
                <Textarea
                  name="special_requests"
                  placeholder={t('form.specialRequestsPlaceholder')}
                  rows={4}
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 resize-none"
                  style={{ color: 'black', backgroundColor: 'white' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
                className="px-6"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isPending || !availabilityData?.available}
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('form.creating')}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('form.createReservation')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}