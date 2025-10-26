'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  Star,
  ChevronDown,
  ChevronUp,
  Headphones,
  Globe,
  Shield,
  Award,
  TrendingUp,
  Users,
  Target,
  Activity
} from 'lucide-react';

interface CustomerSupportSectionProps {
  locale: string;
}

export default function CustomerSupportSection({ locale }: CustomerSupportSectionProps) {
  const [activeContact, setActiveContact] = useState<string | null>(null);

  const content = {
    fr: {
      title: 'Support Client Exceptionnel',
      subtitle: 'Une équipe dédiée à votre service pour un séjour parfait',
      responseTime: 'Temps de réponse',
      availability: 'Disponibilité',
      rating: 'Note de satisfaction',
      languages: 'Langues supportées',
      contacts: {
        chat: {
          title: 'Chat en Direct',
          description: 'Assistance immédiate par chat',
          responseTime: '< 2 minutes',
          availability: '24h/24, 7j/7',
          action: 'Démarrer le chat'
        },
        phone: {
          title: 'Support Téléphonique',
          description: 'Parlez directement à nos experts',
          responseTime: '< 30 secondes',
          availability: '8h-22h tous les jours',
          action: 'Appeler maintenant'
        },
        email: {
          title: 'Support Email',
          description: 'Réponse détaillée à vos questions',
          responseTime: '< 2 heures',
          availability: '24h/24, 7j/7',
          action: 'Envoyer un email'
        }
      },
      stats: {
        satisfaction: '98%',
        responseTime: '1.5 min',
        availability: '24/7',
        languages: '3'
      },
      serviceQuality: {
        title: 'Indicateurs de Qualité de Service',
        metrics: {
          resolutionRate: { value: '96%', label: 'Taux de résolution' },
          firstCallResolution: { value: '89%', label: 'Résolution au premier contact' },
          customerRetention: { value: '94%', label: 'Fidélisation client' },
          averageRating: { value: '4.8/5', label: 'Note moyenne' }
        },
        certifications: [
          { name: 'ISO 9001', description: 'Qualité de service certifiée' },
          { name: 'COPC CX', description: 'Excellence en expérience client' }
        ]
      },
      availabilitySchedule: {
        title: 'Horaires de Disponibilité',
        schedule: {
          chat: { hours: '24h/24, 7j/7', status: 'online' },
          phone: { hours: 'Lun-Dim: 8h-22h', status: 'online' },
          email: { hours: '24h/24, 7j/7', status: 'online' },
          emergency: { hours: '24h/24, 7j/7', status: 'online' }
        }
      },
      emergency: {
        title: 'Urgence 24h/24',
        description: 'Pour les situations d\'urgence pendant votre séjour',
        number: '+213 XXX XXX XXX'
      }
    },
    en: {
      title: 'Exceptional Customer Support',
      subtitle: 'A dedicated team at your service for a perfect stay',
      responseTime: 'Response time',
      availability: 'Availability',
      rating: 'Satisfaction rating',
      languages: 'Supported languages',
      contacts: {
        chat: {
          title: 'Live Chat',
          description: 'Immediate assistance via chat',
          responseTime: '< 2 minutes',
          availability: '24/7',
          action: 'Start chat'
        },
        phone: {
          title: 'Phone Support',
          description: 'Speak directly to our experts',
          responseTime: '< 30 seconds',
          availability: '8am-10pm daily',
          action: 'Call now'
        },
        email: {
          title: 'Email Support',
          description: 'Detailed response to your questions',
          responseTime: '< 2 hours',
          availability: '24/7',
          action: 'Send email'
        }
      },
      stats: {
        satisfaction: '98%',
        responseTime: '1.5 min',
        availability: '24/7',
        languages: '3'
      },
      serviceQuality: {
        title: 'Service Quality Indicators',
        metrics: {
          resolutionRate: { value: '96%', label: 'Resolution Rate' },
          firstCallResolution: { value: '89%', label: 'First Call Resolution' },
          customerRetention: { value: '94%', label: 'Customer Retention' },
          averageRating: { value: '4.8/5', label: 'Average Rating' }
        },
        certifications: [
          { name: 'ISO 9001', description: 'Certified service quality' },
          { name: 'COPC CX', description: 'Customer experience excellence' }
        ]
      },
      availabilitySchedule: {
        title: 'Availability Hours',
        schedule: {
          chat: { hours: '24/7', status: 'online' },
          phone: { hours: 'Mon-Sun: 8am-10pm', status: 'online' },
          email: { hours: '24/7', status: 'online' },
          emergency: { hours: '24/7', status: 'online' }
        }
      },
      emergency: {
        title: '24/7 Emergency',
        description: 'For emergency situations during your stay',
        number: '+213 XXX XXX XXX'
      }
    },
    ar: {
      title: 'دعم عملاء استثنائي',
      subtitle: 'فريق مخصص في خدمتكم لإقامة مثالية',
      responseTime: 'وقت الاستجابة',
      availability: 'التوفر',
      rating: 'تقييم الرضا',
      languages: 'اللغات المدعومة',
      contacts: {
        chat: {
          title: 'دردشة مباشرة',
          description: 'مساعدة فورية عبر الدردشة',
          responseTime: '< دقيقتان',
          availability: '24/7',
          action: 'بدء الدردشة'
        },
        phone: {
          title: 'الدعم الهاتفي',
          description: 'تحدث مباشرة مع خبرائنا',
          responseTime: '< 30 ثانية',
          availability: '8ص-10م يومياً',
          action: 'اتصل الآن'
        },
        email: {
          title: 'دعم البريد الإلكتروني',
          description: 'رد مفصل على أسئلتكم',
          responseTime: '< ساعتان',
          availability: '24/7',
          action: 'إرسال بريد إلكتروني'
        }
      },
      stats: {
        satisfaction: '98%',
        responseTime: '1.5 دقيقة',
        availability: '24/7',
        languages: '3'
      },
      serviceQuality: {
        title: 'مؤشرات جودة الخدمة',
        metrics: {
          resolutionRate: { value: '96%', label: 'معدل الحل' },
          firstCallResolution: { value: '89%', label: 'الحل من أول اتصال' },
          customerRetention: { value: '94%', label: 'الاحتفاظ بالعملاء' },
          averageRating: { value: '4.8/5', label: 'التقييم المتوسط' }
        },
        certifications: [
          { name: 'ISO 9001', description: 'جودة خدمة معتمدة' },
          { name: 'COPC CX', description: 'التميز في تجربة العملاء' }
        ]
      },
      availabilitySchedule: {
        title: 'ساعات التوفر',
        schedule: {
          chat: { hours: '24/7', status: 'online' },
          phone: { hours: 'الإثنين-الأحد: 8ص-10م', status: 'online' },
          email: { hours: '24/7', status: 'online' },
          emergency: { hours: '24/7', status: 'online' }
        }
      },
      emergency: {
        title: 'طوارئ 24/7',
        description: 'للحالات الطارئة أثناء إقامتكم',
        number: '+213 XXX XXX XXX'
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const contactMethods = [
    {
      key: 'chat',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      key: 'phone',
      icon: <Phone className="w-6 h-6" />,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      key: 'email',
      icon: <Mail className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  const toggleContact = (key: string) => {
    setActiveContact(activeContact === key ? null : key);
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

      {/* Support Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Satisfaction Rating */}
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {text.stats.satisfaction}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {text.rating}
            </p>
          </div>

          {/* Response Time */}
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {text.stats.responseTime}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {text.responseTime}
            </p>
          </div>

          {/* Availability */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {text.stats.availability}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {text.availability}
            </p>
          </div>

          {/* Languages */}
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {text.stats.languages}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {text.languages}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, index) => (
          <motion.div
            key={method.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${method.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300`}
          >
            {/* Contact Header */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${method.bgColor} rounded-lg flex items-center justify-center`}>
                  <div className={method.textColor}>
                    {method.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {text.contacts[method.key as keyof typeof text.contacts].title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {text.contacts[method.key as keyof typeof text.contacts].description}
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{text.responseTime}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {text.contacts[method.key as keyof typeof text.contacts].responseTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{text.availability}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {text.contacts[method.key as keyof typeof text.contacts].availability}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => toggleContact(method.key)}
                className={`w-full bg-gradient-to-r from-${method.color}-600 to-${method.color}-700 hover:from-${method.color}-700 hover:to-${method.color}-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2`}
              >
                <span>{text.contacts[method.key as keyof typeof text.contacts].action}</span>
                {activeContact === method.key ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Expanded Contact Info */}
            <AnimatePresence>
              {activeContact === method.key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${method.bgColor} px-6 pb-6`}
                >
                  <div className="space-y-3">
                    {method.key === 'chat' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Démarrez une conversation instantanée avec notre équipe
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            3 agents disponibles
                          </span>
                        </div>
                      </div>
                    )}

                    {method.key === 'phone' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Numéro direct:
                        </p>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          +213 XXX XXX XXX
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Tarifs locaux applicables
                        </p>
                      </div>
                    )}

                    {method.key === 'email' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Email de support:
                        </p>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          support@loftalgerie.com
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Réponse garantie sous 2h
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Emergency Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {text.emergency.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              {text.emergency.description}
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {text.emergency.number}
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Appel d'urgence</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}