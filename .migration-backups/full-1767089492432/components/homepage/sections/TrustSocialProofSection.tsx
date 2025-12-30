'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ContentWrapper } from '@/components/ui/ResponsiveGrid';
import { TrustSectionProps, Review, Certification, TrustStats, Guarantee } from '@/types/dual-audience';
import VerifiedReviewCard from './VerifiedReviewCard';
import RatingAggregation from './RatingAggregation';
import PhotoTestimonials from './PhotoTestimonials';
import QualityCertifications from './QualityCertifications';
import SafetyMeasures from './SafetyMeasures';
import VirtualTourIntegration from './VirtualTourIntegration';
import CustomerSupportSection from './CustomerSupportSection';
import PoliciesSection from './PoliciesSection';
import FAQSection from './FAQSection';

interface TrustSocialProofSectionProps {
  locale: string;
  guestReviews?: Review[];
  certifications?: Certification[];
  stats?: TrustStats;
  guarantees?: Guarantee[];
}

/**
 * Complete Trust and Social Proof Section
 * Implements verified reviews, certifications, safety measures, and customer support
 */
export default function TrustSocialProofSection({ 
  locale,
  guestReviews,
  certifications,
  stats,
  guarantees
}: TrustSocialProofSectionProps) {
  // Multilingual content
  const content = {
    fr: {
      title: "Ils nous font confiance",
      subtitle: "Découvrez les témoignages de nos clients satisfaits et nos garanties de qualité"
    },
    en: {
      title: "They trust us",
      subtitle: "Discover testimonials from our satisfied clients and our quality guarantees"
    },
    ar: {
      title: "يثقون بنا",
      subtitle: "اكتشف شهادات عملائنا الراضين وضمانات الجودة لدينا"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Mock data for demonstration - in real implementation, this would come from props or API
  const mockStats: TrustStats = stats || {
    totalGuests: 1250,
    averageRating: 4.8,
    loftsAvailable: 45,
    yearsExperience: 6,
    satisfactionRate: 98
  };

  const mockReviews: Review[] = guestReviews || [
    {
      id: '1',
      guestName: 'Sarah M.',
      guestAvatar: '/api/placeholder/64/64',
      rating: 5,
      comment: 'Séjour absolument parfait ! Le loft était exactement comme sur les photos, très propre et bien équipé. L\'emplacement est idéal pour visiter Alger.',
      loftName: 'Loft Moderne Centre-ville',
      stayDate: new Date('2024-01-15'),
      verified: true,
      photos: ['/api/placeholder/400/300', '/api/placeholder/400/300']
    },
    {
      id: '2',
      guestName: 'Ahmed K.',
      rating: 5,
      comment: 'Service client exceptionnel ! L\'équipe a été très réactive et professionnelle. Je recommande vivement pour un séjour d\'affaires.',
      loftName: 'Loft Business Hydra',
      stayDate: new Date('2024-01-10'),
      verified: true
    },
    {
      id: '3',
      guestName: 'Marie L.',
      guestAvatar: '/api/placeholder/64/64',
      rating: 4,
      comment: 'Très belle expérience ! Le loft est spacieux et confortable. Parfait pour un séjour en famille.',
      loftName: 'Loft Familial Bab Ezzouar',
      stayDate: new Date('2024-01-05'),
      verified: true,
      photos: ['/api/placeholder/400/300']
    }
  ];

  const mockCertifications: Certification[] = certifications || [
    {
      id: '1',
      name: 'Certification Qualité Tourisme',
      issuer: 'Ministère du Tourisme Algérien',
      icon: '/api/placeholder/48/48',
      validUntil: new Date('2025-12-31'),
      description: 'Certification officielle garantissant la qualité des services touristiques'
    },
    {
      id: '2',
      name: 'ISO 9001:2015',
      issuer: 'Bureau Veritas',
      icon: '/api/placeholder/48/48',
      validUntil: new Date('2025-06-30'),
      description: 'Système de management de la qualité certifié selon les standards internationaux'
    },
    {
      id: '3',
      name: 'Sécurité Incendie',
      issuer: 'Protection Civile',
      icon: '/api/placeholder/48/48',
      validUntil: new Date('2024-12-31'),
      description: 'Conformité aux normes de sécurité incendie pour établissements recevant du public'
    }
  ];

  return (
    <ContentWrapper maxWidth="full">
      <div className="space-y-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {text.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {text.subtitle}
          </p>
        </motion.div>

        {/* Rating Aggregation */}
        <RatingAggregation stats={mockStats} locale={locale} />

        {/* Photo Testimonials */}
        <PhotoTestimonials reviews={mockReviews} locale={locale} />

        {/* Verified Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReviews.map((review) => (
            <VerifiedReviewCard key={review.id} review={review} locale={locale} />
          ))}
        </div>

        {/* Quality Certifications */}
        <QualityCertifications certifications={mockCertifications} locale={locale} />

        {/* Safety Measures */}
        <SafetyMeasures locale={locale} />

        {/* Virtual Tour Integration */}
        <VirtualTourIntegration 
          loftId="sample-loft"
          previewImage="/api/placeholder/800/400"
          locale={locale} 
        />

        {/* Customer Support */}
        <CustomerSupportSection locale={locale} />

        {/* Policies Section */}
        <PoliciesSection locale={locale} />

        {/* FAQ Section */}
        <FAQSection locale={locale} />
      </div>
    </ContentWrapper>
  );
}