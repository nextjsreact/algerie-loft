'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { Loader2, Calendar, Users, CreditCard, CheckCircle, AlertCircle, Star, Building2, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types/customer';

interface Currency {
  id: string
  code: string
  symbol: string
  name: string
  ratio: number      // ratio vs DA (e.g. EUR: 145 means 1 EUR = 145 DA)
  is_default: boolean
}

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
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<{ success?: boolean; error?: string; details?: string[] } | null>(null);
  
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
  const [loftSearch, setLoftSearch] = useState('');

  // Currency state
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [customRatio, setCustomRatio] = useState<string>(''); // editable exchange rate (string to allow "65.0")

  // Pricing state — all strings to allow decimal input like "65.09"
  const [pricePerNightInput, setPricePerNightInput] = useState<string>('');
  const [basePriceInput, setBasePriceInput] = useState<string>('');
  const [cleaningFeeInput, setCleaningFeeInput] = useState<string>('0');
  const [serviceFeeInput, setServiceFeeInput] = useState<string>('');
  const [taxesInput, setTaxesInput] = useState<string>('');
  const [totalAmountInput, setTotalAmountInput] = useState<string>('');

  // No server action state needed - using fetch API

  // Initial payment state
  const [initPaymentAmount, setInitPaymentAmount] = useState<string>('');
  const [initPaymentMethod, setInitPaymentMethod] = useState<string>('cash');
  const [initPaymentRef, setInitPaymentRef] = useState<string>('');
  const [initPaymentDate, setInitPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const selectedLoftData = lofts.find(l => l.id === selectedLoft);
  const nights = availabilityData?.nights || 0;

  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    fetchLofts();
    fetchCurrencies();
    // Check user role — employees can book past dates
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        const role = data?.user?.role;
        setIsEmployee(role === 'employee' || role === 'admin');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedLoft && checkInDate && checkOutDate) {
      checkAvailabilityAndPricing();
    }
  }, [selectedLoft, checkInDate, checkOutDate, guestCount]);

  useEffect(() => {
    if (availabilityData?.pricing) {
      setBasePriceInput(String(availabilityData.pricing.base_price));
      setCleaningFeeInput('0');
      setServiceFeeInput('0');
      setTaxesInput('0');
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

      setBasePriceInput(String(currentBasePrice));
      setCleaningFeeInput('0');
      setServiceFeeInput('0');
      setTaxesInput('0');
      setTotalAmountInput('0');
    }
  }, [availabilityData, selectedLoftData, checkInDate, checkOutDate]);

  // Calculate total amount whenever its components change
  useEffect(() => {
    const total = (parseFloat(basePriceInput) || 0) +
                  (parseFloat(cleaningFeeInput) || 0) +
                  (parseFloat(serviceFeeInput) || 0) +
                  (parseFloat(taxesInput) || 0);
    setTotalAmountInput(String(total));
  }, [basePriceInput, cleaningFeeInput, serviceFeeInput, taxesInput]);

  // Handle successful reservation creation
  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
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

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies');
      if (!res.ok) return;
      const data: Currency[] = await res.json();
      setCurrencies(data);
      const def = data.find(c => c.is_default) || data[0];
      if (def) {
        setSelectedCurrencyId(def.id);
        setSelectedCurrency(def);
        setCustomRatio(String(def.ratio));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
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
    if (!query.trim()) return;
    setIsSearchingCustomer(true);
    try {
      const params = new URLSearchParams({ [type]: query });
      const response = await fetch(`/api/customers/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        const customer = data.customer;
        if (customer) {
          setFoundCustomer(customer);
          // Only fill fields that are currently empty — never overwrite what user typed
          const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
          if (!guestName) setGuestName(fullName);
          if (!guestNationality) setGuestNationality(customer.nationality || '');
          // Don't overwrite email/phone — user just typed one of them
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [guestName, guestNationality]);

  const handleCurrencyChange = (currencyId: string) => {
    setSelectedCurrencyId(currencyId);
    const cur = currencies.find(c => c.id === currencyId) || null;
    setSelectedCurrency(cur);
    setCustomRatio(String(cur?.ratio ?? 1));
    if (pricePerNightInput !== '' && nights > 0) {
      setBasePriceInput(String(parseFloat(pricePerNightInput) * nights));
    }
  };

  // Effective ratio: user can override
  const effectiveRatio = parseFloat(customRatio) || selectedCurrency?.ratio || 1;

  // Convert amount from selected currency to DA
  const toDA = (amount: number): number => {
    if (!selectedCurrency || selectedCurrency.is_default) return amount;
    return Math.round(amount * effectiveRatio);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoft || !checkInDate || !checkOutDate) return;
    if (!availabilityData?.available) return;

    setIsPending(true);
    setState(null);

    try {
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loft_id: selectedLoft,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          guest_nationality: guestNationality,
          guest_count: guestCount,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          customer_id: foundCustomer?.id || null,
          base_price: toDA(parseFloat(basePriceInput) || 0),
          cleaning_fee: toDA(parseFloat(cleaningFeeInput) || 0),
          service_fee: toDA(parseFloat(serviceFeeInput) || 0),
          taxes: toDA(parseFloat(taxesInput) || 0),
          total_amount: toDA(parseFloat(totalAmountInput) || 0),
          // Currency tracking
          currency_code: selectedCurrency?.code || 'DZD',
          currency_ratio: effectiveRatio,
          price_per_night_input: pricePerNightInput !== '' ? parseFloat(pricePerNightInput) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setState({ error: result.error || 'Erreur lors de la création de la réservation' });
      } else {
        // If initial payment provided, record it
        const reservationId = result.data?.id || result.reservation?.id
        if (initPaymentAmount && parseFloat(initPaymentAmount) > 0 && reservationId) {
          const payRes = await fetch(`/api/reservations/${reservationId}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: parseFloat(initPaymentAmount),
              payment_method: initPaymentMethod,
              reference: initPaymentRef || null,
              payment_date: initPaymentDate,
              notes: null,
            }),
          })
          const payData = await payRes.json()
          if (!payData.success) {
            console.error('Payment recording failed:', payData.error)
          }
        }
        setState({ success: true });
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Erreur serveur' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30">
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
          <form onSubmit={handleSubmit} className="space-y-6">

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
                    onOpenChange={(open) => { if (!open) setLoftSearch('') }}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder={t('form.selectLoft')} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] max-h-72" position="popper" sideOffset={4} avoidCollisions={false}>
                      <div className="px-2 py-1.5 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder={t('form.searchLoft')}
                          value={loftSearch}
                          onChange={(e) => setLoftSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="h-8 text-sm"
                          autoComplete="off"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-52">
                        {lofts.filter(l => l.name.toLowerCase().includes(loftSearch.toLowerCase())).length === 0 ? (
                          <div className="px-2 py-4 text-sm text-center text-muted-foreground">{t('form.noLoftFound')}</div>
                        ) : (
                          lofts
                            .filter(l => l.name.toLowerCase().includes(loftSearch.toLowerCase()))
                            .map((loft) => (
                              <SelectItem key={loft.id} value={loft.id} className="py-3">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{loft.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {loft.price_per_night} {defaultCurrencySymbol || 'DZD'}/night
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </div>
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
                    min={isEmployee ? undefined : format(new Date(), 'yyyy-MM-dd')}
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
                    min={isEmployee ? (checkInDate ? format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd') : undefined) : (checkInDate ? format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
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
                        <p className="text-sm text-green-600">{t('form.availableMessage')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 rounded-lg p-4 space-y-3">
                      {/* Header: title + currency selector */}
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900">{t('form.pricingBreakdown')}</h5>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-500">{t('form.currency')}</Label>
                          <Select value={selectedCurrencyId} onValueChange={handleCurrencyChange}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map(c => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.symbol} {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Editable exchange rate (only for non-default currency) */}
                      {selectedCurrency && !selectedCurrency.is_default && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                          <span className="text-xs text-amber-700 flex-1">
                            1 {selectedCurrency.code} =
                          </span>
                          <Input
                            type="number"
                            step="any"
                            value={customRatio}
                            onChange={(e) => setCustomRatio(e.target.value)}
                            onBlur={() => {
                              const v = parseFloat(customRatio);
                              if (isNaN(v) || v <= 0) setCustomRatio(String(selectedCurrency?.ratio ?? 1));
                            }}
                            className="h-7 w-24 text-xs text-right border-amber-300"
                            placeholder={String(selectedCurrency?.ratio ?? 1)}
                          />
                          <span className="text-xs text-amber-700">DA</span>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        {/* Per-night input → auto-calculates base price */}
                        <div className="flex justify-between items-center py-1 bg-blue-50 rounded px-2">
                          <Label className="text-blue-700 font-medium text-xs">
                            {t('form.pricePerNight')} × {nights} {t('form.nights')}
                          </Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{selectedCurrency?.symbol || 'DA'}</span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={pricePerNightInput}
                              onChange={(e) => {
                                setPricePerNightInput(e.target.value);
                                const pn = parseFloat(e.target.value);
                                if (!isNaN(pn) && nights > 0) setBasePriceInput(String(pn * nights));
                              }}
                              className="w-28 text-right h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <Label className="text-gray-600">{t('form.basePrice')} ({nights} {t('form.nights')})</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{selectedCurrency?.symbol || 'DA'}</span>
                            <Input
                              type="number"
                              step="any"
                              value={basePriceInput}
                              onChange={(e) => { setBasePriceInput(e.target.value); setPricePerNightInput(''); }}
                              className="w-28 text-right h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label className="text-gray-600">{t('form.cleaningFee')}</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{selectedCurrency?.symbol || 'DA'}</span>
                            <Input type="number" step="any" value={cleaningFeeInput} onChange={(e) => setCleaningFeeInput(e.target.value)} className="w-28 text-right h-8 text-xs" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label className="text-gray-600">{t('form.serviceFee')}</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{selectedCurrency?.symbol || 'DA'}</span>
                            <Input type="number" step="any" value={serviceFeeInput} onChange={(e) => setServiceFeeInput(e.target.value)} className="w-28 text-right h-8 text-xs" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <Label className="text-gray-600">{t('form.taxes')}</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{selectedCurrency?.symbol || 'DA'}</span>
                            <Input type="number" step="any" value={taxesInput} onChange={(e) => setTaxesInput(e.target.value)} className="w-28 text-right h-8 text-xs" />
                          </div>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center py-2 bg-green-100 rounded-lg px-3">
                          <Label className="font-semibold text-green-800">{t('form.total')}</Label>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-800">
                              {(parseFloat(totalAmountInput) || 0).toLocaleString()} {selectedCurrency?.symbol || 'DA'}
                            </span>
                            {selectedCurrency && !selectedCurrency.is_default && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t('form.convertedAmount', { amount: toDA(parseFloat(totalAmountInput) || 0).toLocaleString() })}
                              </p>
                            )}
                          </div>
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
                      className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                      placeholder={t('form.emailPlaceholder')}
                    />
                    {isSearchingCustomer && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
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
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                      placeholder={t('form.phonePlaceholder')}
                    />
                    {isSearchingCustomer && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
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

            {/* Initial Payment Section */}
            <div className="space-y-4 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                💳 Paiement initial (optionnel)
              </h3>
              <p className="text-sm text-emerald-700">Enregistrez un premier paiement lors de la création de la réservation.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Montant versé</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={initPaymentAmount}
                    onChange={e => setInitPaymentAmount(e.target.value)}
                    placeholder={`Ex: ${(parseFloat(totalAmountInput) || 0).toLocaleString()}`}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Mode de paiement</Label>
                  <Select value={initPaymentMethod} onValueChange={setInitPaymentMethod}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Espèces</SelectItem>
                      <SelectItem value="ccp">🏦 CCP</SelectItem>
                      <SelectItem value="virement">🏛️ Virement bancaire</SelectItem>
                      <SelectItem value="paypal">📱 PayPal</SelectItem>
                      <SelectItem value="cheque">📄 Chèque</SelectItem>
                      <SelectItem value="baridi">📲 Baridi Mob</SelectItem>
                      <SelectItem value="autre">💳 Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date du paiement</Label>
                  <Input
                    type="date"
                    value={initPaymentDate}
                    onChange={e => setInitPaymentDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Référence (optionnel)</Label>
                  <Input
                    value={initPaymentRef}
                    onChange={e => setInitPaymentRef(e.target.value)}
                    placeholder="N° CCP, référence virement..."
                    className="bg-white"
                  />
                </div>
              </div>
              {initPaymentAmount && parseFloat(initPaymentAmount) > 0 && (
                <div className="text-sm text-emerald-700 bg-emerald-100 rounded p-2">
                  Reste à payer après ce versement : <strong>
                    {Math.max(0, (parseFloat(totalAmountInput) || 0) - parseFloat(initPaymentAmount)).toLocaleString()} {defaultCurrencySymbol}
                  </strong>
                </div>
              )}
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
                disabled={isPending || availabilityData?.available === false}
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