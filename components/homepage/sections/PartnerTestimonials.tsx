'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star,
  TrendingUp,
  MapPin,
  Calendar,
  CheckCircle,
  Quote,
  Users,
  Home,
  DollarSign
} from 'lucide-react';

interface PartnerTestimonialsProps {
  locale: string;
}

interface PartnerTestimonial {
  id: string;
  partnerName: string;
  partnerAvatar?: string;
  location: string;
  propertyType: string;
  partnershipDuration: string;
  
  // Performance metrics
  beforeRevenue: number;
  afterRevenue: number;
  occupancyImprovement: number;
  ratingImprovement: number;
  
  // Testimonial
  testimonial: string;
  rating: number;
  
  // Verification
  verified: boolean;
  verificationDate: Date;
  
  // Additional metrics
  totalBookings: number;
  averageStayDuration: number;
  repeatGuestRate: number;
}

/**
 * Partner Testimonials with Verified Results
 * Implements requirements 9.2, 9.4, 9.5
 */
export default function PartnerTestimonials({ locale }: PartnerTestimonialsProps) {
  // Mock testimonials data - in real implementation, this would come from API
  const testimonials: PartnerTestimonial[] = [
    {
      id: "testimonial-1",
      partnerName: "Ahmed Benali",
      partnerAvatar: "/avatars/ahmed-benali.jpg",
      location: "Alger Centre",
      propertyType: "Loft moderne",
      partnershipDuration: "18 mois",
      beforeRevenue: 45000,
      afterRevenue: 68000,
      occupancyImprovement: 32,
      ratingImprovement: 1.2,
      testimonial: "Depuis que j'ai confié mon loft à cette équipe, mes revenus ont augmenté de 51% et je n'ai plus aucun stress de gestion. Ils s'occupent de tout : accueil des clients, nettoyage, maintenance. Je recommande vivement !",
      rating: 5,
      verified: true,
      verificationDate: new Date('2024-01-15'),
      totalBookings: 156,
      averageStayDuration: 3.2,
      repeatGuestRate: 28
    },
    {
      id: "testimonial-2",
      partnerName: "Fatima Khelifi",
      partnerAvatar: "/avatars/fatima-khelifi.jpg",
      location: "Oran Bord de Mer",
      propertyType: "Appartement vue mer",
      partnershipDuration: "12 mois",
      beforeRevenue: 38000,
      afterRevenue: 55000,
      occupancyImprovement: 28,
      ratingImprovement: 0.9,
      testimonial: "Excellente expérience ! L'équipe est très professionnelle et les résultats sont au rendez-vous. Mon appartement est maintenant réservé 85% du temps contre 60% avant. Les clients sont satisfaits et moi aussi !",
      rating: 5,
      verified: true,
      verificationDate: new Date('2024-02-20'),
      totalBookings: 98,
      averageStayDuration: 4.1,
      repeatGuestRate: 22
    },
    {
      id: "testimonial-3",
      partnerName: "Karim Messaoudi",
      partnerAvatar: "/avatars/karim-messaoudi.jpg",
      location: "Constantine",
      propertyType: "Duplex familial",
      partnershipDuration: "24 mois",
      beforeRevenue: 52000,
      afterRevenue: 78000,
      occupancyImprovement: 35,
      ratingImprovement: 1.4,
      testimonial: "Après 2 ans de partenariat, je peux dire que c'est le meilleur investissement que j'ai fait. Non seulement mes revenus ont explosé (+50%), mais la qualité de service est exceptionnelle. Mes clients laissent d'excellents avis !",
      rating: 5,
      verified: true,
      verificationDate: new Date('2023-12-10'),
      totalBookings: 203,
      averageStayDuration: 5.3,
      repeatGuestRate: 35
    },
    {
      id: "testimonial-4",
      partnerName: "Leila Boumediene",
      partnerAvatar: "/avatars/leila-boumediene.jpg",
      location: "Annaba Centre",
      propertyType: "Studio moderne",
      partnershipDuration: "8 mois",
      beforeRevenue: 28000,
      afterRevenue: 41000,
      occupancyImprovement: 25,
      ratingImprovement: 0.8,
      testimonial: "Je suis propriétaire de 3 studios et depuis que je travaille avec eux, c'est un vrai soulagement. Ils optimisent les prix, gèrent les réservations et s'occupent de l'entretien. Mes revenus ont augmenté de 46% !",
      rating: 5,
      verified: true,
      verificationDate: new Date('2024-03-05'),
      totalBookings: 67,
      averageStayDuration: 2.8,
      repeatGuestRate: 18
    }
  ];

  // Multilingual content
  const content = {
    fr: {
      title: "Témoignages de nos partenaires",
      subtitle: "Découvrez les résultats concrets obtenus par nos propriétaires partenaires",
      
      metrics: {
        revenueIncrease: "Augmentation des revenus",
        occupancyImprovement: "Amélioration de l'occupation",
        ratingImprovement: "Amélioration de la note",
        totalBookings: "Réservations totales",
        averageStay: "Durée moyenne de séjour",
        repeatGuests: "Clients fidèles",
        partnershipDuration: "Durée du partenariat",
        verified: "Témoignage vérifié"
      },
      
      labels: {
        before: "Avant",
        after: "Après",
        nights: "nuits",
        months: "mois",
        dzd: "DZD/mois",
        stars: "étoiles"
      },
      
      verificationNote: "Tous nos témoignages sont vérifiés et basés sur des données réelles de performance."
    },
    en: {
      title: "Partner testimonials",
      subtitle: "Discover the concrete results achieved by our partner property owners",
      
      metrics: {
        revenueIncrease: "Revenue increase",
        occupancyImprovement: "Occupancy improvement",
        ratingImprovement: "Rating improvement",
        totalBookings: "Total bookings",
        averageStay: "Average stay duration",
        repeatGuests: "Repeat guests",
        partnershipDuration: "Partnership duration",
        verified: "Verified testimonial"
      },
      
      labels: {
        before: "Before",
        after: "After",
        nights: "nights",
        months: "months",
        dzd: "DZD/month",
        stars: "stars"
      },
      
      verificationNote: "All our testimonials are verified and based on real performance data."
    },
    ar: {
      title: "شهادات شركائنا",
      subtitle: "اكتشف النتائج الملموسة التي حققها أصحاب العقارات الشركاء معنا",
      
      metrics: {
        revenueIncrease: "زيادة الإيرادات",
        occupancyImprovement: "تحسين الإشغال",
        ratingImprovement: "تحسين التقييم",
        totalBookings: "إجمالي الحجوزات",
        averageStay: "متوسط مدة الإقامة",
        repeatGuests: "العملاء المتكررون",
        partnershipDuration: "مدة الشراكة",
        verified: "شهادة موثقة"
      },
      
      labels: {
        before: "قبل",
        after: "بعد",
        nights: "ليالي",
        months: "شهور",
        dzd: "دج/شهر",
        stars: "نجوم"
      },
      
      verificationNote: "جميع شهاداتنا موثقة ومبنية على بيانات أداء حقيقية."
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const calculateRevenueIncrease = (before: number, after: number) => {
    return Math.round(((after - before) / before) * 100);
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

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 space-y-6">
                {/* Partner Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.partnerAvatar} alt={testimonial.partnerName} />
                      <AvatarFallback>
                        {testimonial.partnerName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.partnerName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4" />
                        {testimonial.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Home className="h-4 w-4" />
                        {testimonial.propertyType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {text.metrics.verified}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Revenue Increase */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {text.metrics.revenueIncrease}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      +{calculateRevenueIncrease(testimonial.beforeRevenue, testimonial.afterRevenue)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {testimonial.beforeRevenue.toLocaleString()} → {testimonial.afterRevenue.toLocaleString()} {text.labels.dzd}
                    </div>
                  </div>

                  {/* Occupancy Improvement */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {text.metrics.occupancyImprovement}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      +{testimonial.occupancyImprovement}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {testimonial.totalBookings} {text.metrics.totalBookings.toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {testimonial.averageStayDuration}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {text.labels.nights}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {testimonial.repeatGuestRate}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {text.metrics.repeatGuests.toLowerCase()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {testimonial.partnershipDuration}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {text.metrics.partnershipDuration.toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* Testimonial Quote */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative">
                  <Quote className="h-6 w-6 text-gray-400 absolute top-2 left-2" />
                  <p className="text-gray-700 dark:text-gray-300 italic pl-8 leading-relaxed">
                    "{testimonial.testimonial}"
                  </p>
                </div>

                {/* Partnership Duration Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {text.metrics.partnershipDuration}: {testimonial.partnershipDuration}
                  </Badge>
                  
                  <div className="text-xs text-gray-500">
                    Vérifié le {testimonial.verificationDate.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Verification Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
        <p className="text-blue-800 dark:text-blue-200 font-medium">
          {text.verificationNote}
        </p>
      </div>
    </div>
  );
}