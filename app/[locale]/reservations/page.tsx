'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Calendar,
  List,
  BarChart3,
  Building2,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import ReservationCalendar from '@/components/reservations/reservation-calendar';
import ReservationFormHybrid from '@/components/reservations/reservation-form-hybrid';
import AvailabilityManager from '@/components/reservations/availability-manager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { getRecentReservations, getReservationStats, updateReservationStatus } from '@/lib/actions/reservations';
import { format } from 'date-fns';
import { enUS, fr, ar } from 'date-fns/locale';

function ReservationsPageContent() {
  const t = useTranslations('reservations');
  const locale = useLocale();
  const tAnalytics = useTranslations('analytics');
  const tAvailability = useTranslations('availability');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [initialLoftId, setInitialLoftId] = useState<string | undefined>(undefined);
  const [defaultCurrencySymbol, setDefaultCurrencySymbol] = useState<string>('$');
  const [lofts, setLofts] = useState<any[]>([]);
  const [selectedLoftId, setSelectedLoftId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [reservationStats, setReservationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  const locales = {
    'en': enUS,
    'fr': fr,
    'ar': ar,
  };

  const getDateFnsLocale = () => {
    const lang = locale as keyof typeof locales;
    return locales[lang] || enUS;
  };
  
  // Handle URL parameters - only run once
  useEffect(() => {
    const urlLoftId = searchParams.get('loftId');
    const urlAction = searchParams.get('action');

    if (urlAction === 'new' && urlLoftId) {
      setInitialLoftId(urlLoftId);
      setShowCreateForm(true);
    }
  }, [searchParams]);

  // Fetch data only once on mount
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Fetch currency
        const { data: currencyData } = await supabase
          .from('currencies')
          .select('symbol')
          .eq('is_default', true)
          .single();
        
        if (isMounted && currencyData) {
          setDefaultCurrencySymbol(currencyData.symbol);
        }
        
        // Fetch lofts
        const { data: loftsData } = await supabase
          .from('lofts')
          .select('id, name');
        
        if (isMounted && loftsData) {
          setLofts(loftsData);
        }

        // Fetch recent activities
        const recentReservationsResult = await getRecentReservations();
        if (isMounted && recentReservationsResult.success) {
          setRecentActivities(recentReservationsResult.data || []);
        }

        // Fetch reservation stats
        const statsResult = await getReservationStats();
        if (isMounted && statsResult.success) {
          setReservationStats(statsResult.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized handlers to prevent infinite loops
  const handleReservationSelect = useCallback((reservation: any) => {
    setSelectedReservation(reservation);
  }, []);

  const handleDateSelect = useCallback((start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setShowCreateForm(true);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateForm(false);
    setSelectedDates(null);
    const redirectUrl = searchParams.get('redirectUrl');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  }, [searchParams]);

  const handleStatusUpdate = useCallback(async (reservationId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    const { success, error } = await updateReservationStatus(reservationId, status);

    if (success) {
      setSelectedReservation(null);
      window.location.reload();
    }
  }, []);

  // Update function with useCallback to prevent infinite loops
  const handleAvailabilityUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const stats = reservationStats ? [
    {
      title: tAnalytics('totalReservations'),
      value: reservationStats.totalReservations,
      change: `${Math.round(((reservationStats.totalReservations - reservationStats.totalReservationsLastMonth) / (reservationStats.totalReservationsLastMonth || 1)) * 100)}%`,
      trend: reservationStats.totalReservations >= reservationStats.totalReservationsLastMonth ? 'up' : 'down',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: tAnalytics('monthlyRevenue'),
      value: `${defaultCurrencySymbol}${reservationStats.monthlyRevenue.toLocaleString()}`,
      change: `${Math.round(((reservationStats.monthlyRevenue - reservationStats.monthlyRevenueLastMonth) / (reservationStats.monthlyRevenueLastMonth || 1)) * 100)}%`,
      trend: reservationStats.monthlyRevenue >= reservationStats.monthlyRevenueLastMonth ? 'up' : 'down',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: tAnalytics('occupancyRate'),
      value: `${Math.round(reservationStats.occupancyRate)}%`,
      change: `${Math.round(reservationStats.occupancyRate - reservationStats.occupancyRateLastMonth)}%`,
      trend: reservationStats.occupancyRate >= reservationStats.occupancyRateLastMonth ? 'up' : 'down',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: tAnalytics('guestSatisfaction'),
      value: reservationStats.guestSatisfaction.toFixed(1),
      change: '0', // Placeholder
      trend: 'up', // Placeholder
      icon: Star,
      color: 'bg-yellow-500'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {t('title')}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('description')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('create')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="relative overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm h-32 animate-pulse"></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          {stat.change}
                        </Badge>
                        <span className="text-xs text-gray-500">{t('vsLastMonth')}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50/20 pointer-events-none" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Calendar className="h-4 w-4" />
                {t('tabs.calendar')}
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <List className="h-4 w-4" />
                {t('tabs.list')}
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                {t('tabs.analytics')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Calendar */}
              <div className="xl:col-span-2">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" />
                      {t('calendar.title')}
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {t('live')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ReservationCalendar
                      key={refreshKey}
                      loftId={selectedLoftId}
                      onReservationSelect={handleReservationSelect}
                      onDateSelect={handleDateSelect}
                      defaultCurrencySymbol={defaultCurrencySymbol}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Loft Selector */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      {t('selectLoft')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={selectedLoftId || ''}
                      onChange={(e) => setSelectedLoftId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('allLofts')}</option>
                      {lofts.map((loft) => (
                        <option key={loft.id} value={loft.id}>
                          {loft.name}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      {t('actions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('new')}
                    </Button>
                    <Button asChild variant="outline" className="w-full border-blue-200 hover:bg-blue-50">
                      <Link href={`/${locale}/customers`}>
                        <Users className="h-4 w-4 mr-2" />
                        {t('guests')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-purple-200 hover:bg-purple-50">
                      <Link href={`/${locale}/reports`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t('reportsLabel')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      {t('activity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      </div>
                    ) : recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                          <div className={`p-1.5 rounded-full ${
                            activity.status === 'confirmed' ? 'bg-green-100' :
                            activity.status === 'completed' ? 'bg-blue-100' : 
                            activity.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            {activity.status === 'confirmed' ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                             activity.status === 'completed' ? <Calendar className="h-3 w-3 text-blue-600" /> :
                             activity.status === 'pending' ? <Clock className="h-3 w-3 text-yellow-600" /> :
                             <AlertCircle className="h-3 w-3 text-red-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{activity.lofts.name}</p>
                            <p className="text-xs text-gray-500">{activity.guest_name === 'next react' ? t('form.guest') : activity.guest_name} • {format(new Date(activity.created_at), 'PP', { locale: getDateFnsLocale() })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        {t('activities.noRecentActivity')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Availability Management */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  {tAvailability('management')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {t('pro')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AvailabilityManager
                  lofts={lofts}
                  selectedLoftId={selectedLoftId}
                  onUpdate={handleAvailabilityUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <List className="h-5 w-5" />
                  {t('list.title')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {t('comingSoon')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <List className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('list.advancedTitle')}</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {t('list.advancedDescription')}
                  </p>
                  <div className="flex justify-center gap-2 pt-4">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">{t('list.advancedFilters')}</Badge>
                    <Badge variant="outline" className="border-teal-200 text-teal-700">{t('list.bulkActions')}</Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">{t('list.exportOptions')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: tAnalytics('totalReservations'), value: '0', change: '0%', icon: Calendar, color: 'from-blue-600 to-indigo-600' },
                { title: tAnalytics('totalRevenue'), value: `${defaultCurrencySymbol}0`, change: '0%', icon: TrendingUp, color: 'from-green-600 to-emerald-600' },
                { title: tAnalytics('occupancyRate'), value: '0%', change: '0%', icon: Building2, color: 'from-purple-600 to-pink-600' },
                { title: tAnalytics('averageStay'), value: '0', change: '0', icon: Clock, color: 'from-orange-600 to-red-600' }
              ].map((metric, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        <metric.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        {metric.change}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                      <p className="text-xs text-gray-500">{tAnalytics('vsLastMonth')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Placeholder for future analytics */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  {tAnalytics('title')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {t('enterpriseTag')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{tAnalytics('enterpriseSuite')}</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      {tAnalytics('enterpriseDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Reservation Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                {t('form.title')}
              </DialogTitle>
            </DialogHeader>
            <ReservationFormHybrid
              initialCheckIn={selectedDates?.start ? selectedDates.start.toISOString().split('T')[0] : undefined}
              initialCheckOut={selectedDates?.end ? selectedDates.end.toISOString().split('T')[0] : undefined}
              initialLoftId={initialLoftId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
              defaultCurrencySymbol={defaultCurrencySymbol}
            />
          </DialogContent>
        </Dialog>

        {/* Reservation Details Dialog */}
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                {t('details.title')}
              </DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        {t('details.guest')}
                      </h4>
                      <p className="font-medium">{selectedReservation.guest_name}</p>
                      <p className="text-sm text-gray-600">{selectedReservation.guest_email}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        {t('details.dates')}
                      </h4>
                      <p className="font-medium">{selectedReservation.check_in_date} - {selectedReservation.check_out_date}</p>
                      <p className="text-sm text-gray-600">
                        {t('nights', { count: selectedReservation.nights })}
                      </p>
                      <Badge variant={
                        selectedReservation.status === 'confirmed' ? 'default' :
                        selectedReservation.status === 'completed' ? 'secondary' :
                        selectedReservation.status === 'cancelled' ? 'destructive' :
                        'outline'
                      }>
                        {t(`status.${selectedReservation.status}`)}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        {t('details.loft')}
                      </h4>
                      <p className="font-medium">{selectedReservation.lofts?.name}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        {t('details.total')}
                      </h4>
                      <p className="text-2xl font-bold text-emerald-600">{selectedReservation.total_amount} {defaultCurrencySymbol}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedReservation.special_requests && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        {t('details.specialRequests')}
                      </h4>
                      <p className="text-gray-700">{selectedReservation.special_requests}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-4">
                  {selectedReservation.status === 'pending' && (
                    <>
                      <Button onClick={() => handleStatusUpdate(selectedReservation.id, 'confirmed')}>
                        {t('statusActions.confirm')}
                      </Button>
                      <Button variant="destructive" onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}>
                        {t('statusActions.cancel')}
                      </Button>
                    </>
                  )}
                  {selectedReservation.status === 'confirmed' && (
                    <>
                      <Button onClick={() => handleStatusUpdate(selectedReservation.id, 'completed')}>
                        {t('statusActions.complete')}
                      </Button>
                      <Button variant="destructive" onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}>
                        {t('statusActions.cancel')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReservationsPageContent />
    </Suspense>
  );
}
