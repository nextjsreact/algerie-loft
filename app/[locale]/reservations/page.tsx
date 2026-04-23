'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Loader2,
  Search,
  X,
  Filter,
  Trash2,
  ChevronDown
} from 'lucide-react';
import ReservationCalendar from '@/components/reservations/reservation-calendar';
import ReservationFormHybrid from '@/components/reservations/reservation-form-hybrid';
import AvailabilityManager from '@/components/reservations/availability-manager';
import { ReservationEditDialog } from '@/components/reservations/reservation-edit-dialog';
import { ReservationPayments } from '@/components/reservations/reservation-payments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { getRecentReservations, getReservationStats, updateReservationStatus } from '@/lib/actions/reservations';
import { format } from 'date-fns';
import { enUS, fr, ar } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const [editReservation, setEditReservation] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const searchParams = useSearchParams();

  const [allReservations, setAllReservations] = useState<any[]>([]);

  // Filter states for list tab
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLoft, setFilterLoft] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loftSearch, setLoftSearch] = useState('');
  const [loftPopoverOpen, setLoftPopoverOpen] = useState(false);

  // Fetch all reservations for list tab (via API to bypass RLS)
  const fetchAllReservations = useCallback(async () => {
    try {
      // Auto-complete past reservations first
      await fetch('/api/reservations/auto-complete', { method: 'POST' }).catch(() => {})
      const response = await fetch('/api/reservations');
      if (!response.ok) return;
      const data = await response.json();
      if (data.reservations) setAllReservations(data.reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllReservations();
  }, [fetchAllReservations, refreshKey]);

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
    toast.success('Réservation créée avec succès', {
      description: 'La réservation a été enregistrée.'
    });
    setRefreshKey(prev => prev + 1);
    fetchAllReservations();
    // Re-fetch recent activities
    getRecentReservations().then(result => {
      if (result.success) setRecentActivities(result.data || []);
    });
    getReservationStats().then(result => {
      if (result.success) setReservationStats(result.data);
    });
  }, [fetchAllReservations]);

  const handleStatusUpdate = useCallback(async (reservationId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { success, error } = await updateReservationStatus(reservationId, status);

      if (success) {
        // Afficher un toast de succès
        const messages = {
          pending: 'Réservation réactivée',
          confirmed: 'Réservation confirmée avec succès',
          cancelled: 'Réservation annulée',
          completed: 'Réservation marquée comme terminée'
        };
        
        toast.success(messages[status], {
          description: 'Le statut a été mis à jour'
        });

        // Fermer le dialog
        setSelectedReservation(null);
        
        // Rafraîchir les données sans recharger la page
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error('Erreur', {
          description: error || 'Impossible de mettre à jour le statut'
        });
      }
    } catch (err) {
      toast.error('Erreur', {
        description: 'Une erreur inattendue s\'est produite'
      });
    }
  }, []);

  const handleDeleteReservation = useCallback(async (reservationId: string) => {
    setDeletingId(reservationId);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/delete`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Réservation supprimée', { description: 'La réservation a été supprimée définitivement.' });
        setSelectedReservation(null);
        setConfirmDelete(false);
        setRefreshKey(prev => prev + 1);
        fetchAllReservations();
      } else {
        toast.error('Erreur', { description: data.error || 'Impossible de supprimer la réservation' });
      }
    } catch {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    } finally {
      setDeletingId(null);
    }
  }, [fetchAllReservations]);

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
                      {t('form.selectLoft')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Popover open={loftPopoverOpen} onOpenChange={(open) => { setLoftPopoverOpen(open); if (!open) setLoftSearch('') }}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <span className="truncate">
                            {selectedLoftId ? lofts.find(l => l.id === selectedLoftId)?.name : t('allLofts')}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0" align="start" side="bottom" sideOffset={4}>
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                              placeholder="Rechercher un loft..."
                              value={loftSearch}
                              onChange={(e) => setLoftSearch(e.target.value)}
                              className="h-8 pl-7 text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto p-1">
                          <button
                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${!selectedLoftId ? 'bg-accent font-medium' : ''}`}
                            onClick={() => { setSelectedLoftId(undefined); setLoftPopoverOpen(false) }}
                          >
                            {t('allLofts')}
                          </button>
                          {lofts
                            .filter(l => l.name.toLowerCase().includes(loftSearch.toLowerCase()))
                            .map(loft => (
                              <button
                                key={loft.id}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${selectedLoftId === loft.id ? 'bg-accent font-medium' : ''}`}
                                onClick={() => { setSelectedLoftId(loft.id); setLoftPopoverOpen(false) }}
                              >
                                {loft.name}
                              </button>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Actions rapides
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
            {/* Filters */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher invité ou loft..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  {/* Status filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] h-10">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">{t('status.pending')}</SelectItem>
                      <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                      <SelectItem value="blocked">🔒 Bloqué</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Loft filter */}
                  <Select value={filterLoft} onValueChange={setFilterLoft}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue placeholder="Appartement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les apparts</SelectItem>
                      {lofts.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Date from */}
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-[150px] h-10"
                    title="Date d'arrivée depuis"
                  />
                  {/* Date to */}
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-[150px] h-10"
                    title="Date d'arrivée jusqu'à"
                  />
                  {/* Reset */}
                  {(filterSearch || filterStatus !== 'all' || filterLoft !== 'all' || filterDateFrom || filterDateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFilterSearch(''); setFilterStatus('all'); setFilterLoft('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
                      className="h-10 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <List className="h-5 w-5" />
                  {t('list.title')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    {(() => {
                      const filtered = allReservations.filter(res => {
                        if (filterSearch && !res.lofts?.name?.toLowerCase().includes(filterSearch.toLowerCase()) && !res.guest_name?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
                        if (filterStatus !== 'all' && res.status !== filterStatus) return false;
                        if (filterLoft !== 'all' && res.loft_id !== filterLoft) return false;
                        if (filterDateFrom && res.check_out_date && res.check_out_date <= filterDateFrom) return false;
                        if (filterDateTo && res.check_in_date > filterDateTo) return false;
                        return true;
                      });
                      return filtered.length;
                    })()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const filtered = allReservations.filter(res => {
                    if (filterSearch && !res.lofts?.name?.toLowerCase().includes(filterSearch.toLowerCase()) && !res.guest_name?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
                    if (filterStatus !== 'all' && res.status !== filterStatus) return false;
                    if (filterLoft !== 'all' && res.loft_id !== filterLoft) return false;
                    if (filterDateFrom && res.check_out_date && res.check_out_date <= filterDateFrom) return false;
                    if (filterDateTo && res.check_in_date > filterDateTo) return false;
                    return true;
                  });
                  if (filtered.length === 0) return (
                    <div className="p-12 text-center text-gray-500">{t('upcoming.empty')}</div>
                  );
                  return (
                    <div className="divide-y divide-gray-100">
                      {filtered.map((res) => (
                        <div key={res.id} className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer ${res._is_block ? 'bg-orange-50/50' : ''}`}
                          onClick={() => !res._is_block && setSelectedReservation(res)}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              res._is_block ? 'bg-orange-100' :
                              res.status === 'confirmed' ? 'bg-green-100' :
                              res.status === 'completed' ? 'bg-blue-100' :
                              res.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              {res._is_block ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                               res.status === 'confirmed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                               res.status === 'completed' ? <Calendar className="h-4 w-4 text-blue-600" /> :
                               res.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                               <AlertCircle className="h-4 w-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{res.lofts?.name}</p>
                              <p className="text-sm text-gray-500">
                                {res._is_block
                                  ? `🔒 ${res.blocked_reason || 'Bloqué'} • ${res.check_in_date} → ${res.check_out_date}`
                                  : `${res.guest_name || res.guest_phone || '—'} • ${res.check_in_date} → ${res.check_out_date}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {res._is_block ? (
                              <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50">
                                {res.blocked_reason === 'maintenance' ? '🔧 Maintenance' :
                                 res.blocked_reason === 'personal_use' ? '🏠 Usage personnel' :
                                 res.blocked_reason === 'renovation' ? '🔨 Rénovation' :
                                 '🔒 Bloqué'}
                              </Badge>
                            ) : (
                              <>
                                <Badge variant={
                                  res.status === 'confirmed' ? 'default' :
                                  res.status === 'completed' ? 'secondary' :
                                  res.status === 'cancelled' ? 'destructive' : 'outline'
                                }>
                                  {t(`status.${res.status}`)}
                                </Badge>
                                {res.total_amount > 0 && (
                                  <span className="text-sm font-semibold text-gray-700">{res.total_amount.toLocaleString()} {defaultCurrencySymbol}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            {/* Analytics Cards — real data from reservationStats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                [1,2,3,4].map(i => (
                  <Card key={i} className="border-0 shadow-lg bg-white/90 h-36 animate-pulse" />
                ))
              ) : reservationStats ? (() => {
                const totalRes = reservationStats.totalReservations ?? 0
                const totalResLast = reservationStats.totalReservationsLastMonth ?? 0
                const revenue = reservationStats.monthlyRevenue ?? 0
                const revenueLast = reservationStats.monthlyRevenueLastMonth ?? 0
                const occupancy = Math.round(reservationStats.occupancyRate ?? 0)
                const occupancyLast = Math.round(reservationStats.occupancyRateLastMonth ?? 0)

                // Average stay from allReservations
                const completedRes = allReservations.filter(r => r.status !== 'cancelled' && r.check_in_date && r.check_out_date)
                const avgStay = completedRes.length > 0
                  ? Math.round(completedRes.reduce((sum, r) => {
                      const nights = Math.ceil((new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) / 86400000)
                      return sum + (nights > 0 ? nights : 0)
                    }, 0) / completedRes.length * 10) / 10
                  : 0

                const pct = (cur: number, prev: number) => {
                  if (prev === 0) return cur > 0 ? '+100%' : '0%'
                  const p = Math.round(((cur - prev) / prev) * 100)
                  return (p >= 0 ? '+' : '') + p + '%'
                }

                const metrics = [
                  {
                    title: tAnalytics('totalReservations'),
                    value: totalRes.toLocaleString(),
                    change: pct(totalRes, totalResLast),
                    up: totalRes >= totalResLast,
                    icon: Calendar,
                    color: 'from-blue-600 to-indigo-600'
                  },
                  {
                    title: tAnalytics('totalRevenue'),
                    value: revenue.toLocaleString('fr-DZ') + ' DA',
                    change: pct(revenue, revenueLast),
                    up: revenue >= revenueLast,
                    icon: TrendingUp,
                    color: 'from-green-600 to-emerald-600'
                  },
                  {
                    title: tAnalytics('occupancyRate'),
                    value: occupancy + '%',
                    change: (occupancy - occupancyLast >= 0 ? '+' : '') + (occupancy - occupancyLast) + '%',
                    up: occupancy >= occupancyLast,
                    icon: Building2,
                    color: 'from-purple-600 to-pink-600'
                  },
                  {
                    title: tAnalytics('averageStay'),
                    value: avgStay + ' nuits',
                    change: '—',
                    up: true,
                    icon: Clock,
                    color: 'from-orange-600 to-red-600'
                  },
                ]

                return metrics.map((metric, index) => (
                  <Card key={index} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="secondary" className={`border-0 ${metric.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                ))
              })() : (
                <div className="col-span-4 text-center text-gray-400 py-8">Aucune donnée disponible</div>
              )}
            </div>

            {/* Top lofts by revenue */}
            {allReservations.length > 0 && (() => {
              const byLoft = new Map<string, { name: string; revenue: number; count: number }>()
              allReservations
                .filter(r => r.status !== 'cancelled' && r.total_amount > 0)
                .forEach(r => {
                  const key = r.loft_id
                  const name = r.lofts?.name || '—'
                  if (!byLoft.has(key)) byLoft.set(key, { name, revenue: 0, count: 0 })
                  const entry = byLoft.get(key)!
                  entry.revenue += r.total_amount
                  entry.count++
                })
              const sorted = Array.from(byLoft.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
              const maxRev = sorted[0]?.revenue || 1

              return (
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <CardTitle className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5" />
                      Top lofts par revenus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {sorted.map((loft, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                        <span className="text-sm text-gray-700 w-40 truncate">{loft.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                            style={{ width: `${Math.round((loft.revenue / maxRev) * 100)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                            {loft.revenue.toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">{loft.count} rés.</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })()}
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
                {t('create')}
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
        <Dialog open={!!selectedReservation} onOpenChange={(open) => { if (!open) { setSelectedReservation(null); setConfirmDelete(false); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
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
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        {t('details.guest')}
                      </h4>
                      {selectedReservation.guest_name ? (
                        <p className="font-semibold text-gray-900">{selectedReservation.guest_name}</p>
                      ) : (
                        <p className="text-gray-400 italic text-sm">Nom non renseigné</p>
                      )}
                      {selectedReservation.guest_phone ? (
                        <div className="flex items-center gap-2 mt-2">
                          <a href={`tel:${selectedReservation.guest_phone}`}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium">
                            📞 {selectedReservation.guest_phone}
                          </a>
                          <a
                            href={`https://wa.me/${selectedReservation.guest_phone.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors">
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <p className="text-amber-600 text-sm mt-1">⚠️ Pas de téléphone</p>
                      )}
                      {selectedReservation.guest_email && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          ✉️ <a href={`mailto:${selectedReservation.guest_email}`} className="hover:underline text-blue-600">{selectedReservation.guest_email}</a>
                        </p>
                      )}
                      {selectedReservation.guest_nationality && (
                        <p className="text-sm text-gray-500 mt-1">🌍 {selectedReservation.guest_nationality}</p>
                      )}
                      {!selectedReservation.guest_name && !selectedReservation.guest_phone && !selectedReservation.guest_email && (
                        <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded">⚠️ Aucune information de contact disponible</p>
                      )}
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

                {/* Payments section */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Paiements
                    </h4>
                    <ReservationPayments
                      reservationId={selectedReservation.id}
                      totalAmount={selectedReservation.total_amount}
                      currency={defaultCurrencySymbol}
                      onUpdate={() => { setRefreshKey(prev => prev + 1); fetchAllReservations(); }}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between gap-4">
                  {/* Delete button — left side with confirmation */}
                  <div className="flex items-center gap-2">
                    {!confirmDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-red-700 font-medium">Confirmer la suppression ?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          disabled={!!deletingId}
                          onClick={() => handleDeleteReservation(selectedReservation.id)}
                        >
                          {deletingId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Oui, supprimer'}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-3">
                  {selectedReservation.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditReservation(selectedReservation);
                        setShowEditDialog(true);
                        setSelectedReservation(null);
                      }}
                    >
                      ✏️ {t('edit.editButton')}
                    </Button>
                  )}
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
                  {selectedReservation.status === 'cancelled' && (
                    <Button onClick={() => handleStatusUpdate(selectedReservation.id, 'pending')} variant="outline">
                      Réactiver la réservation
                    </Button>
                  )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Edit Reservation Dialog */}
        <ReservationEditDialog
          reservation={editReservation}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            fetchAllReservations();
          }}
        />
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
