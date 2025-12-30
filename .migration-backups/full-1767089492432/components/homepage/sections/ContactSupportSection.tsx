'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Users, Shield } from 'lucide-react';
import { ContentWrapper } from '@/components/ui/ResponsiveGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContextualSupportSystem from '@/components/support/ContextualSupportSystem';
import { CustomerServiceRatings } from '@/components/support/CustomerServiceRatings';

interface ContactSupportSectionProps {
  locale: string;
  userContext?: {
    isGuest?: boolean;
    currentAction?: 'browsing' | 'booking' | 'searching' | 'viewing_loft' | 'checkout';
    loftId?: string;
    bookingId?: string;
  };
}

/**
 * Enhanced contact and support section with contextual support system
 * Implements multi-channel contact options and contextual help
 */
export default function ContactSupportSection({ 
  locale,
  userContext = { isGuest: true, currentAction: 'browsing' }
}: ContactSupportSectionProps) {
  const [showSupportSystem, setShowSupportSystem] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      title: "Besoin d'aide ?",
      subtitle: "Notre équipe est là pour vous accompagner 24h/24",
      description: "Choisissez le canal de communication qui vous convient le mieux pour une assistance personnalisée",
      stats: {
        responseTime: "Temps de réponse moyen",
        satisfaction: "Satisfaction client",
        availability: "Disponibilité",
        languages: "Langues supportées"
      },
      values: {
        responseTime: "< 2 minutes",
        satisfaction: "4.9/5",
        availability: "24/7",
        languages: "3"
      },
      features: {
        title: "Pourquoi choisir notre support ?",
        items: [
          {
            icon: "⚡",
            title: "Réponse rapide",
            description: "Support instantané par chat et téléphone"
          },
          {
            icon: "🎯",
            title: "Aide contextuelle",
            description: "Assistance adaptée à votre situation actuelle"
          },
          {
            icon: "🌍",
            title: "Multilingue",
            description: "Support en français, anglais et arabe"
          },
          {
            icon: "🔒",
            title: "Sécurisé",
            description: "Vos données sont protégées et confidentielles"
          }
        ]
      },
      actions: {
        getHelp: "Obtenir de l'aide",
        viewHours: "Voir les horaires",
        emergency: "Urgence"
      },
      hours: {
        title: "Heures de support",
        phone: "Téléphone: Lun-Dim 8h-22h",
        chat: "Chat en direct: 24/7",
        email: "Email: 24/7 (réponse sous 2-4h)",
        emergency: "Urgences: 24/7"
      }
    },
    en: {
      title: "Need help?",
      subtitle: "Our team is here to support you 24/7",
      description: "Choose the communication channel that suits you best for personalized assistance",
      stats: {
        responseTime: "Average response time",
        satisfaction: "Customer satisfaction",
        availability: "Availability",
        languages: "Supported languages"
      },
      values: {
        responseTime: "< 2 minutes",
        satisfaction: "4.9/5",
        availability: "24/7",
        languages: "3"
      },
      features: {
        title: "Why choose our support?",
        items: [
          {
            icon: "⚡",
            title: "Fast response",
            description: "Instant support via chat and phone"
          },
          {
            icon: "🎯",
            title: "Contextual help",
            description: "Assistance adapted to your current situation"
          },
          {
            icon: "🌍",
            title: "Multilingual",
            description: "Support in French, English and Arabic"
          },
          {
            icon: "🔒",
            title: "Secure",
            description: "Your data is protected and confidential"
          }
        ]
      },
      actions: {
        getHelp: "Get help",
        viewHours: "View hours",
        emergency: "Emergency"
      },
      hours: {
        title: "Support hours",
        phone: "Phone: Mon-Sun 8am-10pm",
        chat: "Live chat: 24/7",
        email: "Email: 24/7 (response within 2-4h)",
        emergency: "Emergencies: 24/7"
      }
    },
    ar: {
      title: "تحتاج مساعدة؟",
      subtitle: "فريقنا هنا لدعمك 24/7",
      description: "اختر قناة التواصل التي تناسبك للحصول على مساعدة شخصية",
      stats: {
        responseTime: "متوسط وقت الاستجابة",
        satisfaction: "رضا العملاء",
        availability: "التوفر",
        languages: "اللغات المدعومة"
      },
      values: {
        responseTime: "< 2 دقائق",
        satisfaction: "4.9/5",
        availability: "24/7",
        languages: "3"
      },
      features: {
        title: "لماذا تختار دعمنا؟",
        items: [
          {
            icon: "⚡",
            title: "استجابة سريعة",
            description: "دعم فوري عبر الدردشة والهاتف"
          },
          {
            icon: "🎯",
            title: "مساعدة سياقية",
            description: "مساعدة مكيفة مع وضعك الحالي"
          },
          {
            icon: "🌍",
            title: "متعدد اللغات",
            description: "دعم بالفرنسية والإنجليزية والعربية"
          },
          {
            icon: "🔒",
            title: "آمن",
            description: "بياناتك محمية وسرية"
          }
        ]
      },
      actions: {
        getHelp: "احصل على مساعدة",
        viewHours: "عرض الساعات",
        emergency: "طوارئ"
      },
      hours: {
        title: "ساعات الدعم",
        phone: "هاتف: الإثنين-الأحد 8ص-10م",
        chat: "دردشة مباشرة: 24/7",
        email: "بريد إلكتروني: 24/7 (استجابة خلال 2-4 ساعات)",
        emergency: "طوارئ: 24/7"
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
        className="space-y-12"
      >
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {text.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            {text.subtitle}
          </p>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {text.description}
          </p>
        </div>

        {/* Customer Service Ratings and Availability Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CustomerServiceRatings 
            locale={locale}
            showDetailedMetrics={true}
            className="mb-8"
          />
        </motion.div>

        {/* Support Statistics - Legacy (keeping for compatibility) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { 
              label: text.stats.responseTime, 
              value: text.values.responseTime, 
              icon: <Clock className="w-6 h-6 text-blue-600" />,
              color: "blue"
            },
            { 
              label: text.stats.satisfaction, 
              value: text.values.satisfaction, 
              icon: <Star className="w-6 h-6 text-yellow-600" />,
              color: "yellow"
            },
            { 
              label: text.stats.availability, 
              value: text.values.availability, 
              icon: <Shield className="w-6 h-6 text-green-600" />,
              color: "green"
            },
            { 
              label: text.stats.languages, 
              value: text.values.languages, 
              icon: <Users className="w-6 h-6 text-purple-600" />,
              color: "purple"
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Support System */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <Button
                onClick={() => setShowSupportSystem(!showSupportSystem)}
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-3"
              >
                {text.actions.getHelp}
              </Button>
            </div>

            {showSupportSystem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ContextualSupportSystem
                  locale={locale}
                  userContext={userContext}
                  className="border-t border-gray-200 dark:border-gray-700 pt-8"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Support Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {text.features.items.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-3">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Support Hours */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {text.hours.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                { label: text.hours.phone, badge: "Standard" },
                { label: text.hours.chat, badge: "Instant" },
                { label: text.hours.email, badge: "Detailed" },
                { label: text.hours.emergency, badge: "Urgent" }
              ].map((hour, index) => (
                <div key={index} className="space-y-2">
                  <Badge variant="outline" className="mb-2">
                    {hour.badge}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {hour.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ContentWrapper>
  );
}