'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Customer, deleteCustomer } from '@/lib/actions/customers';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Star,
  Activity,
  Crown,
  Zap,
  Target,
  Globe,
  Sparkles,
  Building,
  Heart,
  Shield
} from 'lucide-react';

interface CustomersManagementProps {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

export function CustomersManagement({ customers, setCustomers }: CustomersManagementProps) {
  const t = useTranslations('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    active: 0,
    prospects: 0,
    former: 0
  });

  // Calculer les statistiques
  const stats = {
    total: customers.length,
    active: customers.length, // All customers are considered active since we don't have status field
    prospects: 0,
    former: 0
  };

  // Animation des statistiques
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        callback(current);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    setTimeout(() => {
      animateValue(0, stats.total, 1500, (value) => 
        setAnimatedStats(prev => ({ ...prev, total: value }))
      );
      animateValue(0, stats.active, 1800, (value) => 
        setAnimatedStats(prev => ({ ...prev, active: value }))
      );
      animateValue(0, stats.prospects, 2000, (value) => 
        setAnimatedStats(prev => ({ ...prev, prospects: value }))
      );
      animateValue(0, stats.former, 1600, (value) => 
        setAnimatedStats(prev => ({ ...prev, former: value }))
      );
    }, 500);
  }, [stats.total, stats.active, stats.prospects, stats.former]);

  // Filtrer les clients
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      (customer.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.address?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t('deleteConfirm', { name }))) {
      const result = await deleteCustomer(id);
      if (result.success) {
        setCustomers(customers.filter(customer => customer.id !== id));
        toast.success(t('deleteSuccess', { name }));
      } else {
        toast.error(t('deleteError', { error: result.message || '' }));
      }
    }
  };

  const getStatusColor = () => {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  const getStatusIcon = () => {
    return <Crown className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Éléments de fond futuristes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* En-tête avec design premium */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-full mb-6">
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium">{t('hub.title')}</span>
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Statistiques avec design holographique */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Clients */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-300">{t('stats.totalClients')}</CardTitle>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-white mb-2">
                    {animatedStats.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-slate-300">{t('stats.clientBase')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clients Actifs */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-emerald-300">{t('stats.activeClients')}</CardTitle>
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-white mb-2">
                    {animatedStats.active}
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">{t('stats.loyal')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prospects */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-300">{t('stats.prospects')}</CardTitle>
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-white mb-2">
                    {animatedStats.prospects}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-slate-300">{t('stats.potential')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Anciens Clients */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-xl rounded-3xl group-hover:blur-2xl transition-all duration-500"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-2xl"></div>
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-300">{t('stats.formerClients')}</CardTitle>
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-white mb-2">
                    {animatedStats.former}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-slate-300">{t('stats.history')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>    
    {/* Contrôles avec design futuriste */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-blue-500/10 blur-xl rounded-3xl"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                {/* Recherche */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={t('searchCustomers')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                  />
                </div>

                {/* Filtres */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">Tous les clients</span>
                  </div>

                  {/* Mode d'affichage */}
                  <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Bouton Nouveau Client */}
                  <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/25">
                    <Link href="/customers/new">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('newCustomer')}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des clients */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-blue-500/5 blur-xl rounded-3xl"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">
                    {t('title')} ({filteredCustomers.length})
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {t('hub.intelligentPlatform')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{viewMode === 'grid' ? t('viewModes.grid') : t('viewModes.list')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-slate-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('noCustomersFound')}</h3>
                  <p className="text-slate-400 mb-6">
                    {searchTerm
                      ? t('noCustomersMessage')
                      : t('addFirstCustomer')
                    }
                  </p>
                  <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                    <Link href="/customers/new">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('addCustomer')}
                    </Link>
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCustomers.map((customer, index) => (
                    <div key={customer.id} className="group relative" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                      <Card className="relative bg-black/20 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-xl"></div>
                        <CardHeader className="relative pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-white/20">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email}`} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                  {customer.full_name ? customer.full_name[0].toUpperCase() : customer.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">
                                  {customer.full_name || customer.email}
                                </h3>
                                <Badge className={`${getStatusColor()} text-xs`}>
                                  {getStatusIcon()}
                                  <span className="ml-1">Client</span>
                                </Badge>
                              </div>
                            </div>
                            <div className="relative">
                              <button className="p-1 text-slate-400 hover:text-white transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="relative space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail className="h-3 w-3 text-blue-400" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Phone className="h-3 w-3 text-green-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <MapPin className="h-3 w-3 text-orange-400" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Calendar className="h-3 w-3 text-purple-400" />
                            <span>{new Date(customer.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <Star className="h-3 w-3 text-gray-600" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild className="bg-black/20 border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-500/50">
                                <Link href={`/customers/${customer.id}`}>
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild className="bg-black/20 border-white/20 text-white hover:bg-green-500/20 hover:border-green-500/50">
                                <Link href={`/customers/${customer.id}/edit`}>
                                  <Edit className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(customer.id, customer.full_name || customer.email)}
                                className="bg-black/20 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer, index) => (
                    <div key={customer.id} className="group relative" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-2 border-white/20">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email}`} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm">
                              {customer.full_name ? customer.full_name[0].toUpperCase() : customer.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white">
                                {customer.full_name || customer.email}
                              </h3>
                              <Badge className={`${getStatusColor()} text-xs`}>
                                {getStatusIcon()}
                                <span className="ml-1">Client</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-300">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-blue-400" />
                                <span>{customer.email}</span>
                              </div>
                              {customer.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-green-400" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-orange-400" />
                                  <span className="truncate max-w-32">{customer.address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-purple-400" />
                                <span>{new Date(customer.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild className="bg-black/20 border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-500/50">
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              {t('actions.view')}
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild className="bg-black/20 border-white/20 text-white hover:bg-green-500/20 hover:border-green-500/50">
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              {t('actions.edit')}
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(customer.id, customer.full_name || customer.email)}
                            className="bg-black/20 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {t('actions.delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}