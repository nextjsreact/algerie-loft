'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ContentWrapper } from '@/components/ui/ResponsiveGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Home, 
  DollarSign, 
  Users, 
  Calendar,
  Shield,
  Wrench,
  Phone,
  BarChart3,
  Banknote,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';
import type { OwnerSectionProps, RevenueMetrics, OwnerService, CaseStudy } from '@/types/dual-audience';
import PropertyEvaluationForm from './PropertyEvaluationForm';
import MarketAnalysisTools from './MarketAnalysisTools';
import PartnerTestimonials from './PartnerTestimonials';

interface PropertyOwnerSectionProps {
  locale: string;
  showEvaluationForm?: boolean;
  showMarketAnalysis?: boolean;
  showTestimonials?: boolean;
}

/**
 * Enhanced Property Owner Section with performance metrics, case studies, and transparent fee structure
 * Implements requirements 4.2, 4.3, 9.1, 9.3
 */
export default function PropertyOwnerSection({ 
  locale, 
  showEvaluationForm = false,
  showMarketAnalysis = false,
  showTestimonials = true
}: PropertyOwnerSectionProps) {
  // Mock data - in real implementation, this would come from props or API
  const revenueMetrics: RevenueMetrics = {
    averageIncrease: "+45%",
    occupancyRate: "85%",
    averageRevenue: "€2,500",
    managedProperties: 150,
    totalRevenue: "€375,000"
  };

  const services: OwnerService[] = [
    {
      id: "complete-management",
      title: "Gestion complète",
      description: "Nous nous occupons de tout",
      icon: "🏠",
      features: ["Accueil des clients", "Nettoyage professionnel", "Gestion des clés"],
      pricing: "15% des revenus"
    },
    {
      id: "revenue-optimization",
      title: "Optimisation revenus",
      description: "Prix dynamiques et stratégies",
      icon: "📈",
      features: ["Tarification intelligente", "Analyse de marché", "Stratégies saisonnières"],
      pricing: "Inclus"
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description: "Entretien et réparations",
      icon: "🛠️",
      features: ["Maintenance préventive", "Réparations d'urgence", "Réseau d'artisans"],
      pricing: "Au coût réel"
    },
    {
      id: "support-247",
      title: "Support 24/7",
      description: "Assistance continue",
      icon: "📞",
      features: ["Hotline propriétaires", "Support clients", "Gestion des urgences"],
      pricing: "Inclus"
    },
    {
      id: "detailed-reports",
      title: "Rapports détaillés",
      description: "Suivi de performance",
      icon: "📊",
      features: ["Tableaux de bord", "Analyses mensuelles", "Prévisions"],
      pricing: "Inclus"
    },
    {
      id: "guaranteed-payments",
      title: "Paiements garantis",
      description: "Revenus sécurisés",
      icon: "💰",
      features: ["Paiements mensuels", "Assurance loyers", "Garantie de revenus"],
      pricing: "Inclus"
    }
  ];

  const caseStudies: CaseStudy[] = [
    {
      id: "case-1",
      propertyName: "Loft Moderne Centre-ville",
      location: "Alger Centre",
      beforeRevenue: 1800,
      afterRevenue: 2650,
      timeframe: "6 mois",
      improvements: [
        "Optimisation tarifaire",
        "Photos professionnelles",
        "Amélioration de l'annonce",
        "Gestion proactive"
      ],
      ownerTestimonial: "Mes revenus ont augmenté de 47% en seulement 6 mois. L'équipe est très professionnelle."
    },
    {
      id: "case-2",
      propertyName: "Appartement Vue Mer",
      location: "Oran Bord de Mer",
      beforeRevenue: 2200,
      afterRevenue: 3100,
      timeframe: "4 mois",
      improvements: [
        "Stratégie saisonnière",
        "Partenariats locaux",
        "Service conciergerie",
        "Marketing ciblé"
      ],
      ownerTestimonial: "Excellent service, je recommande vivement. Mes revenus n'ont jamais été aussi élevés."
    }
  ];

  // Multilingual content
  const content = {
    fr: {
      title: "Propriétaires, maximisez vos revenus",
      subtitle: "Confiez-nous la gestion de votre loft et augmentez vos revenus locatifs de manière significative",
      metricsTitle: "Nos résultats parlent d'eux-mêmes",
      servicesTitle: "Nos services inclus",
      caseStudiesTitle: "Études de cas réels",
      feeStructureTitle: "Structure tarifaire transparente",
      cta: "Évaluer mon bien gratuitement",
      ctaSecondary: "Télécharger la brochure",
      metrics: {
        averageIncrease: "Augmentation moyenne des revenus",
        occupancyRate: "Taux d'occupation moyen",
        averageRevenue: "Revenus mensuels moyens",
        managedProperties: "Propriétés gérées",
        totalRevenue: "Revenus générés (mensuel)"
      },
      beforeAfter: "Avant / Après",
      testimonial: "Témoignage",
      improvements: "Améliorations apportées",
      timeframe: "Délai",
      feeStructure: {
        management: "Frais de gestion",
        managementDesc: "15% des revenus générés uniquement",
        setup: "Frais de mise en service",
        setupDesc: "Gratuit - Photos et annonce incluses",
        maintenance: "Maintenance",
        maintenanceDesc: "Au coût réel - Réseau d'artisans partenaires",
        guarantee: "Garantie de revenus",
        guaranteeDesc: "Remboursement si objectifs non atteints"
      }
    },
    en: {
      title: "Property owners, maximize your income",
      subtitle: "Entrust us with managing your loft and significantly increase your rental income",
      metricsTitle: "Our results speak for themselves",
      servicesTitle: "Our included services",
      caseStudiesTitle: "Real case studies",
      feeStructureTitle: "Transparent fee structure",
      cta: "Evaluate my property for free",
      ctaSecondary: "Download brochure",
      metrics: {
        averageIncrease: "Average revenue increase",
        occupancyRate: "Average occupancy rate",
        averageRevenue: "Average monthly revenue",
        managedProperties: "Properties managed",
        totalRevenue: "Revenue generated (monthly)"
      },
      beforeAfter: "Before / After",
      testimonial: "Testimonial",
      improvements: "Improvements made",
      timeframe: "Timeframe",
      feeStructure: {
        management: "Management fees",
        managementDesc: "15% of generated revenue only",
        setup: "Setup fees",
        setupDesc: "Free - Photos and listing included",
        maintenance: "Maintenance",
        maintenanceDesc: "At actual cost - Partner craftsmen network",
        guarantee: "Revenue guarantee",
        guaranteeDesc: "Refund if objectives not met"
      }
    },
    ar: {
      title: "أصحاب العقارات، اعظموا دخلكم",
      subtitle: "عهدوا إلينا بإدارة شقتكم المفروشة وزيدوا دخلكم الإيجاري بشكل كبير",
      metricsTitle: "نتائجنا تتحدث عن نفسها",
      servicesTitle: "خدماتنا المشمولة",
      caseStudiesTitle: "دراسات حالة حقيقية",
      feeStructureTitle: "هيكل رسوم شفاف",
      cta: "قيم عقاري مجاناً",
      ctaSecondary: "تحميل الكتيب",
      metrics: {
        averageIncrease: "متوسط زيادة الإيرادات",
        occupancyRate: "متوسط معدل الإشغال",
        averageRevenue: "متوسط الإيرادات الشهرية",
        managedProperties: "العقارات المُدارة",
        totalRevenue: "الإيرادات المُحققة (شهرياً)"
      },
      beforeAfter: "قبل / بعد",
      testimonial: "شهادة",
      improvements: "التحسينات المُطبقة",
      timeframe: "الإطار الزمني",
      feeStructure: {
        management: "رسوم الإدارة",
        managementDesc: "15% من الإيرادات المُحققة فقط",
        setup: "رسوم الإعداد",
        setupDesc: "مجاني - الصور والإعلان مشمولان",
        maintenance: "الصيانة",
        maintenanceDesc: "بالتكلفة الفعلية - شبكة حرفيين شركاء",
        guarantee: "ضمان الإيرادات",
        guaranteeDesc: "استرداد إذا لم تتحقق الأهداف"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <ContentWrapper maxWidth="full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-16"
      >
        {/* Section Header - Positioned after guest experience (80/20 rule) */}
        <div className="text-center relative">
          {/* Subtle visual indicator that this is secondary content */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <div className="w-16 h-1 bg-gradient-to-r from-purple-300 to-orange-300 rounded-full opacity-60"></div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full mb-6">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Pour les propriétaires
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
              {text.title}
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {text.subtitle}
          </p>
        </div>

        {/* Revenue Metrics Section */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {text.metricsTitle}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600 mb-2">{revenueMetrics.averageIncrease}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{text.metrics.averageIncrease}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600 mb-2">{revenueMetrics.occupancyRate}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{text.metrics.occupancyRate}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-600 mb-2">{revenueMetrics.averageRevenue}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{text.metrics.averageRevenue}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6 text-center">
                <Home className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-orange-600 mb-2">{revenueMetrics.managedProperties}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{text.metrics.managedProperties}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6 text-center">
                <Banknote className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-yellow-600 mb-2">{revenueMetrics.totalRevenue}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{text.metrics.totalRevenue}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Case Studies Section */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {text.caseStudiesTitle}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {caseStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Property Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {study.propertyName}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">{study.location}</p>
                    </div>

                    {/* Before/After Revenue */}
                    <div className="bg-gradient-to-r from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {text.beforeAfter}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">€{study.beforeRevenue}</div>
                          <div className="text-xs text-gray-500">Avant</div>
                        </div>
                        <ArrowUpRight className="h-6 w-6 text-green-600" />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">€{study.afterRevenue}</div>
                          <div className="text-xs text-gray-500">Après</div>
                        </div>
                        <div className="text-center">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            +{Math.round(((study.afterRevenue - study.beforeRevenue) / study.beforeRevenue) * 100)}%
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">{text.timeframe}: {study.timeframe}</div>
                        </div>
                      </div>
                    </div>

                    {/* Improvements */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {text.improvements}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {study.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Testimonial */}
                    {study.ownerTestimonial && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {text.testimonial}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{study.ownerTestimonial}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {text.servicesTitle}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-4xl">{service.icon}</div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {service.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {service.description}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    {service.pricing && (
                      <Badge variant="outline" className="mt-2">
                        {service.pricing}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Transparent Fee Structure */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {text.feeStructureTitle}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {text.feeStructure.management}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {text.feeStructure.managementDesc}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {text.feeStructure.setup}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {text.feeStructure.setupDesc}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6 text-center">
                <Wrench className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {text.feeStructure.maintenance}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {text.feeStructure.maintenanceDesc}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {text.feeStructure.guarantee}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {text.feeStructure.guaranteeDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Partner Testimonials */}
        {showTestimonials && (
          <div>
            <PartnerTestimonials locale={locale} />
          </div>
        )}

        {/* Market Analysis Tools */}
        {showMarketAnalysis && (
          <div>
            <MarketAnalysisTools locale={locale} />
          </div>
        )}

        {/* Property Evaluation Form */}
        {showEvaluationForm && (
          <div>
            <PropertyEvaluationForm locale={locale} />
          </div>
        )}

        {/* CTA Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {text.cta}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20 px-8 py-4"
            >
              {text.ctaSecondary}
            </Button>
          </div>
        </div>
      </motion.div>
    </ContentWrapper>
  );
}