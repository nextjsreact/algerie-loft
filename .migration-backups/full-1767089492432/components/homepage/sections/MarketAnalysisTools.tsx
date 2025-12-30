'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Home,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import type { MarketAnalysis, RevenueProjection, SeasonalData, CompetitorData } from '@/types/dual-audience';

interface MarketAnalysisToolsProps {
  locale: string;
}

/**
 * Market Analysis Tools and Revenue Projections
 * Implements requirements 9.2, 9.4, 9.5
 */
export default function MarketAnalysisTools({ locale }: MarketAnalysisToolsProps) {
  const [selectedCity, setSelectedCity] = useState<string>('algiers');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('loft');

  // Mock market data - in real implementation, this would come from API
  const marketData: Record<string, Record<string, MarketAnalysis>> = {
    algiers: {
      loft: {
        averageRate: 8500,
        occupancyPotential: 82,
        seasonalTrends: [
          { month: 1, occupancyRate: 75, averagePrice: 8000, demand: 'medium' },
          { month: 2, occupancyRate: 78, averagePrice: 8200, demand: 'medium' },
          { month: 3, occupancyRate: 85, averagePrice: 8800, demand: 'high' },
          { month: 4, occupancyRate: 88, averagePrice: 9200, demand: 'high' },
          { month: 5, occupancyRate: 92, averagePrice: 9500, demand: 'high' },
          { month: 6, occupancyRate: 95, averagePrice: 10000, demand: 'high' },
          { month: 7, occupancyRate: 98, averagePrice: 11000, demand: 'high' },
          { month: 8, occupancyRate: 96, averagePrice: 10500, demand: 'high' },
          { month: 9, occupancyRate: 90, averagePrice: 9000, demand: 'high' },
          { month: 10, occupancyRate: 85, averagePrice: 8500, demand: 'medium' },
          { month: 11, occupancyRate: 80, averagePrice: 8000, demand: 'medium' },
          { month: 12, occupancyRate: 88, averagePrice: 9500, demand: 'high' }
        ],
        competitivePosition: 'high'
      },
      apartment: {
        averageRate: 6500,
        occupancyPotential: 78,
        seasonalTrends: [
          { month: 1, occupancyRate: 70, averagePrice: 6000, demand: 'medium' },
          { month: 2, occupancyRate: 72, averagePrice: 6200, demand: 'medium' },
          { month: 3, occupancyRate: 80, averagePrice: 6800, demand: 'high' },
          { month: 4, occupancyRate: 82, averagePrice: 7000, demand: 'high' },
          { month: 5, occupancyRate: 85, averagePrice: 7200, demand: 'high' },
          { month: 6, occupancyRate: 88, averagePrice: 7500, demand: 'high' },
          { month: 7, occupancyRate: 90, averagePrice: 8000, demand: 'high' },
          { month: 8, occupancyRate: 88, averagePrice: 7800, demand: 'high' },
          { month: 9, occupancyRate: 82, averagePrice: 7000, demand: 'medium' },
          { month: 10, occupancyRate: 78, averagePrice: 6500, demand: 'medium' },
          { month: 11, occupancyRate: 75, averagePrice: 6200, demand: 'medium' },
          { month: 12, occupancyRate: 82, averagePrice: 7200, demand: 'high' }
        ],
        competitivePosition: 'medium'
      }
    },
    oran: {
      loft: {
        averageRate: 7200,
        occupancyPotential: 79,
        seasonalTrends: [
          { month: 1, occupancyRate: 72, averagePrice: 6800, demand: 'medium' },
          { month: 2, occupancyRate: 74, averagePrice: 7000, demand: 'medium' },
          { month: 3, occupancyRate: 82, averagePrice: 7500, demand: 'high' },
          { month: 4, occupancyRate: 85, averagePrice: 7800, demand: 'high' },
          { month: 5, occupancyRate: 88, averagePrice: 8000, demand: 'high' },
          { month: 6, occupancyRate: 92, averagePrice: 8500, demand: 'high' },
          { month: 7, occupancyRate: 95, averagePrice: 9000, demand: 'high' },
          { month: 8, occupancyRate: 93, averagePrice: 8800, demand: 'high' },
          { month: 9, occupancyRate: 87, averagePrice: 7800, demand: 'medium' },
          { month: 10, occupancyRate: 82, averagePrice: 7200, demand: 'medium' },
          { month: 11, occupancyRate: 78, averagePrice: 6900, demand: 'medium' },
          { month: 12, occupancyRate: 85, averagePrice: 8000, demand: 'high' }
        ],
        competitivePosition: 'high'
      }
    }
  };

  const competitorData: CompetitorData[] = [
    {
      name: "Airbnb",
      averagePrice: 7800,
      occupancyRate: 75,
      rating: 4.2,
      amenities: ["WiFi", "Kitchen", "TV"]
    },
    {
      name: "Booking.com",
      averagePrice: 8200,
      occupancyRate: 78,
      rating: 4.1,
      amenities: ["WiFi", "Parking", "AC"]
    },
    {
      name: "Autres plateformes",
      averagePrice: 7500,
      occupancyRate: 72,
      rating: 3.9,
      amenities: ["WiFi", "Kitchen"]
    }
  ];

  const currentMarket = marketData[selectedCity]?.[selectedPropertyType] || marketData.algiers.loft;
  
  const revenueProjection: RevenueProjection = {
    monthlyRevenue: Math.round(currentMarket.averageRate * (currentMarket.occupancyPotential / 100) * 30),
    annualRevenue: Math.round(currentMarket.averageRate * (currentMarket.occupancyPotential / 100) * 365),
    occupancyRate: currentMarket.occupancyPotential,
    averageDailyRate: currentMarket.averageRate,
    currency: 'DZD',
    confidence: 0.85
  };

  // Multilingual content
  const content = {
    fr: {
      title: "Analyse de marché et projections",
      subtitle: "Découvrez le potentiel de revenus de votre propriété avec nos outils d'analyse",
      
      sections: {
        marketOverview: "Vue d'ensemble du marché",
        revenueProjection: "Projection de revenus",
        seasonalTrends: "Tendances saisonnières",
        competitorAnalysis: "Analyse concurrentielle"
      },
      
      fields: {
        selectCity: "Sélectionner la ville",
        selectPropertyType: "Type de propriété"
      },
      
      cities: {
        algiers: "Alger",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba"
      },
      
      propertyTypes: {
        loft: "Loft",
        apartment: "Appartement",
        studio: "Studio",
        villa: "Villa"
      },
      
      metrics: {
        averageRate: "Tarif moyen/nuit",
        occupancyPotential: "Potentiel d'occupation",
        monthlyRevenue: "Revenus mensuels estimés",
        annualRevenue: "Revenus annuels estimés",
        averageDailyRate: "Tarif journalier moyen",
        confidence: "Niveau de confiance",
        competitivePosition: "Position concurrentielle"
      },
      
      months: [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
        "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
      ],
      
      demand: {
        low: "Faible",
        medium: "Moyenne", 
        high: "Forte"
      },
      
      competitivePositions: {
        low: "À améliorer",
        medium: "Bonne",
        high: "Excellente"
      },
      
      insights: {
        title: "Insights clés",
        peakSeason: "Saison haute : Juin-Août",
        bestMonths: "Meilleurs mois pour maximiser les revenus",
        optimization: "Opportunités d'optimisation identifiées",
        marketPosition: "Position favorable sur le marché local"
      },
      
      cta: "Obtenir une analyse personnalisée"
    },
    en: {
      title: "Market analysis and projections",
      subtitle: "Discover your property's revenue potential with our analysis tools",
      
      sections: {
        marketOverview: "Market overview",
        revenueProjection: "Revenue projection",
        seasonalTrends: "Seasonal trends",
        competitorAnalysis: "Competitor analysis"
      },
      
      fields: {
        selectCity: "Select city",
        selectPropertyType: "Property type"
      },
      
      cities: {
        algiers: "Algiers",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba"
      },
      
      propertyTypes: {
        loft: "Loft",
        apartment: "Apartment",
        studio: "Studio",
        villa: "Villa"
      },
      
      metrics: {
        averageRate: "Average rate/night",
        occupancyPotential: "Occupancy potential",
        monthlyRevenue: "Estimated monthly revenue",
        annualRevenue: "Estimated annual revenue",
        averageDailyRate: "Average daily rate",
        confidence: "Confidence level",
        competitivePosition: "Competitive position"
      },
      
      months: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      
      demand: {
        low: "Low",
        medium: "Medium",
        high: "High"
      },
      
      competitivePositions: {
        low: "Needs improvement",
        medium: "Good",
        high: "Excellent"
      },
      
      insights: {
        title: "Key insights",
        peakSeason: "Peak season: June-August",
        bestMonths: "Best months to maximize revenue",
        optimization: "Optimization opportunities identified",
        marketPosition: "Favorable position in local market"
      },
      
      cta: "Get personalized analysis"
    },
    ar: {
      title: "تحليل السوق والتوقعات",
      subtitle: "اكتشف إمكانات إيرادات عقارك باستخدام أدوات التحليل لدينا",
      
      sections: {
        marketOverview: "نظرة عامة على السوق",
        revenueProjection: "توقع الإيرادات",
        seasonalTrends: "الاتجاهات الموسمية",
        competitorAnalysis: "تحليل المنافسين"
      },
      
      fields: {
        selectCity: "اختر المدينة",
        selectPropertyType: "نوع العقار"
      },
      
      cities: {
        algiers: "الجزائر",
        oran: "وهران",
        constantine: "قسنطينة",
        annaba: "عنابة"
      },
      
      propertyTypes: {
        loft: "شقة مفروشة",
        apartment: "شقة",
        studio: "استوديو",
        villa: "فيلا"
      },
      
      metrics: {
        averageRate: "المعدل المتوسط/ليلة",
        occupancyPotential: "إمكانية الإشغال",
        monthlyRevenue: "الإيرادات الشهرية المقدرة",
        annualRevenue: "الإيرادات السنوية المقدرة",
        averageDailyRate: "المعدل اليومي المتوسط",
        confidence: "مستوى الثقة",
        competitivePosition: "الموقف التنافسي"
      },
      
      months: [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ],
      
      demand: {
        low: "منخفض",
        medium: "متوسط",
        high: "عالي"
      },
      
      competitivePositions: {
        low: "يحتاج تحسين",
        medium: "جيد",
        high: "ممتاز"
      },
      
      insights: {
        title: "رؤى رئيسية",
        peakSeason: "الموسم الذروة: يونيو-أغسطس",
        bestMonths: "أفضل الشهور لتعظيم الإيرادات",
        optimization: "تم تحديد فرص التحسين",
        marketPosition: "موقف مناسب في السوق المحلي"
      },
      
      cta: "احصل على تحليل شخصي"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompetitivePositionColor = (position: string) => {
    switch (position) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {text.title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {text.subtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="min-w-[200px]">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger>
              <SelectValue placeholder={text.fields.selectCity} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(text.cities).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="min-w-[200px]">
          <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder={text.fields.selectPropertyType} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(text.propertyTypes).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {text.sections.marketOverview}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {currentMarket.averageRate.toLocaleString()} DZD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.averageRate}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {currentMarket.occupancyPotential}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.occupancyPotential}
              </div>
            </div>
            
            <div className="text-center">
              <Badge className={getCompetitivePositionColor(currentMarket.competitivePosition)}>
                {text.competitivePositions[currentMarket.competitivePosition as keyof typeof text.competitivePositions]}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {text.metrics.competitivePosition}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(revenueProjection.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.confidence}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {text.sections.revenueProjection}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-green-600 mb-2">
                {revenueProjection.monthlyRevenue.toLocaleString()} DZD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.monthlyRevenue}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {Math.round(revenueProjection.annualRevenue / 1000)}K DZD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.annualRevenue}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-6 text-center">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {revenueProjection.averageDailyRate.toLocaleString()} DZD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {text.metrics.averageDailyRate}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {text.sections.seasonalTrends}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentMarket.seasonalTrends.map((trend, index) => (
              <div key={trend.month} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {text.months[index]}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {trend.occupancyRate}%
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {trend.averagePrice.toLocaleString()} DZD
                </div>
                <Badge className={getDemandColor(trend.demand)} size="sm">
                  {text.demand[trend.demand as keyof typeof text.demand]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {text.sections.competitorAnalysis}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitorData.map((competitor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {competitor.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span>⭐ {competitor.rating}</span>
                    <span>{competitor.occupancyRate}% occupation</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {competitor.averagePrice.toLocaleString()} DZD
                  </div>
                  <div className="text-sm text-gray-500">par nuit</div>
                </div>
                
                <div className="ml-4">
                  {competitor.averagePrice > currentMarket.averageRate ? (
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                  ) : competitor.averagePrice < currentMarket.averageRate ? (
                    <ArrowDownRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            {text.insights.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{text.insights.peakSeason}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">{text.insights.bestMonths}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Target className="h-4 w-4" />
                <span className="text-sm">{text.insights.optimization}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{text.insights.marketPosition}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Button 
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {text.cta}
        </Button>
      </div>
    </div>
  );
}