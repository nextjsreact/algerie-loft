'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import { Certification } from '@/types/dual-audience';

interface QualityCertificationsProps {
  certifications: Certification[];
  locale: string;
}

export default function QualityCertifications({ certifications, locale }: QualityCertificationsProps) {
  const content = {
    fr: {
      title: 'Certifications et Qualité',
      subtitle: 'Nos standards de qualité reconnus par les organismes officiels',
      validUntil: 'Valide jusqu\'au',
      viewCertificate: 'Voir le certificat',
      professionalManagement: 'Gestion Professionnelle',
      qualityStandards: 'Standards de Qualité',
      safetyProtocols: 'Protocoles de Sécurité'
    },
    en: {
      title: 'Certifications & Quality',
      subtitle: 'Our quality standards recognized by official organizations',
      validUntil: 'Valid until',
      viewCertificate: 'View certificate',
      professionalManagement: 'Professional Management',
      qualityStandards: 'Quality Standards',
      safetyProtocols: 'Safety Protocols'
    },
    ar: {
      title: 'الشهادات والجودة',
      subtitle: 'معايير الجودة المعترف بها من قبل المنظمات الرسمية',
      validUntil: 'صالح حتى',
      viewCertificate: 'عرض الشهادة',
      professionalManagement: 'إدارة مهنية',
      qualityStandards: 'معايير الجودة',
      safetyProtocols: 'بروتوكولات السلامة'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getCertificationIcon = (certification: Certification) => {
    // Map certification types to appropriate icons
    if (certification.name.toLowerCase().includes('safety') || 
        certification.name.toLowerCase().includes('sécurité') ||
        certification.name.toLowerCase().includes('سلامة')) {
      return <Shield className="w-8 h-8" />;
    }
    if (certification.name.toLowerCase().includes('quality') || 
        certification.name.toLowerCase().includes('qualité') ||
        certification.name.toLowerCase().includes('جودة')) {
      return <Award className="w-8 h-8" />;
    }
    return <CheckCircle className="w-8 h-8" />;
  };

  const getCertificationCategory = (certification: Certification) => {
    if (certification.name.toLowerCase().includes('management') || 
        certification.name.toLowerCase().includes('gestion')) {
      return text.professionalManagement;
    }
    if (certification.name.toLowerCase().includes('quality') || 
        certification.name.toLowerCase().includes('qualité')) {
      return text.qualityStandards;
    }
    if (certification.name.toLowerCase().includes('safety') || 
        certification.name.toLowerCase().includes('sécurité')) {
      return text.safetyProtocols;
    }
    return text.qualityStandards;
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {text.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {text.subtitle}
        </p>
      </div>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((certification, index) => (
          <motion.div
            key={certification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
          >
            {/* Certification Header */}
            <div className="flex items-start space-x-4 mb-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                {certification.icon ? (
                  <img
                    src={certification.icon}
                    alt={certification.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                    {getCertificationIcon(certification)}
                  </div>
                )}
              </div>

              {/* Certification Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {certification.name}
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {getCertificationCategory(certification)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {certification.issuer}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {certification.description}
            </p>

            {/* Validity and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Validity */}
              {certification.validUntil && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {text.validUntil}
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatDate(certification.validUntil)}
                  </span>
                </div>
              )}

              {/* View Certificate Link */}
              <button className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <span>{text.viewCertificate}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Badge */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Certification vérifiée
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex flex-wrap justify-center items-center gap-8">
          {/* Professional Management Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {text.professionalManagement}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Certifié ISO 9001
              </div>
            </div>
          </div>

          {/* Quality Standards Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {text.qualityStandards}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Standards internationaux
              </div>
            </div>
          </div>

          {/* Safety Protocols Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {text.safetyProtocols}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sécurité garantie
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}