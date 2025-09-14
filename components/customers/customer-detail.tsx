'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Customer } from '@/lib/actions/customers';
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Star,
  Activity,
  Crown,
  Target,
  Building,
  Heart,
  Shield,
  User,
  Clock,
  MessageCircle,
  FileText,
  TrendingUp,
  Zap,
  Globe,
  Sparkles
} from 'lucide-react';

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const t = useTranslations('customers');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'prospect': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'former': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Crown className="h-4 w-4" />;
      case 'prospect': return <Target className="h-4 w-4" />;
      case 'former': return <Activity className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Éléments de fond futuristes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="outline" asChild className="bg-black/20 border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-500/50">
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('actions.backToCustomers')}
            </Link>
          </Button>
        </div>

        {/* En-tête du profil */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl rounded-3xl"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Avatar et informations principales */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email}`} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xl">
                        {customer.first_name[0]}{customer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                      {getStatusIcon(customer.status)}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {customer.first_name} {customer.last_name}
                    </h1>
                    <Badge className={`${getStatusColor(customer.status)} text-sm mb-4`}>
                      {getStatusIcon(customer.status)}
                      <span className="ml-2">{t(`statusOptions.${customer.status}`)}</span>
                    </Badge>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-gray-600" />
                      <span className="text-slate-300 text-sm ml-2">4.0/5</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-1 flex justify-end">
                  <div className="flex items-center gap-3">
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('actions.contact')}
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                      <Link href={`/customers/${customer.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('actions.edit')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations détaillées */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Informations de contact */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-3xl"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{t('detail.contactInfo')}</CardTitle>
                      <CardDescription className="text-purple-300">{t('detail.contactDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">{t('email')}</span>
                      </div>
                      <p className="text-white font-medium">{customer.email}</p>
                    </div>
                    
                    {customer.phone && (
                      <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-300">{t('phone')}</span>
                        </div>
                        <p className="text-white font-medium">{customer.phone}</p>
                      </div>
                    )}
                    
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">{t('detail.clientSince')}</span>
                      </div>
                      <p className="text-white font-medium">
                        {new Date(customer.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-orange-300">{t('detail.lastUpdate')}</span>
                      </div>
                      <p className="text-white font-medium">
                        {new Date(customer.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="p-4 bg-gradient-to-r from-slate-500/10 to-blue-500/10 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium text-cyan-300">{t('notes')}</span>
                      </div>
                      <p className="text-white">{customer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Historique des interactions */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl rounded-3xl"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{t('detail.interactionHistory')}</CardTitle>
                      <CardDescription className="text-emerald-300">{t('detail.interactionDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl border border-white/10">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{t('detail.clientCreated')}</h4>
                          <span className="text-xs text-slate-400">
                            {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">
                          {t('detail.profileCreated')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400">{t('detail.noInteractions')}</p>
                      <p className="text-sm text-slate-500 mt-1">{t('detail.futureInteractions')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar avec statistiques */}
          <div className="space-y-8">
            {/* Statistiques rapides */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-xl rounded-3xl"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white">{t('detail.statistics')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-slate-300">{t('detail.satisfaction')}</span>
                      </div>
                      <span className="font-bold text-white">4.0/5</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-300">{t('detail.interactions')}</span>
                      </div>
                      <span className="font-bold text-white">1</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-slate-300">{t('detail.reservations')}</span>
                      </div>
                      <span className="font-bold text-white">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl rounded-3xl"></div>
              <Card className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white">{t('detail.quickActions')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    {t('actions.email')}
                  </Button>
                  
                  {customer.phone && (
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      {t('actions.call')}
                    </Button>
                  )}
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('actions.schedule')}
                  </Button>
                  
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('actions.addNote')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}