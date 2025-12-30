'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Shield, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface PoliciesSectionProps {
  locale: string;
}

export default function PoliciesSection({ locale }: PoliciesSectionProps) {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const content = {
    fr: {
      title: 'Politiques Transparentes',
      subtitle: 'Des conditions claires pour une réservation en toute confiance',
      policies: {
        cancellation: {
          title: 'Politique d\'Annulation',
          icon: <XCircle className="w-5 h-5" />,
          summary: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée',
          details: {
            free: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée',
            partial: 'Remboursement de 50% entre 48h et 24h avant l\'arrivée',
            noRefund: 'Aucun remboursement moins de 24h avant l\'arrivée',
            exceptions: 'Exceptions pour cas de force majeure (maladie, urgence familiale)',
            process: 'Remboursement automatique sous 3-5 jours ouvrables'
          }
        },
        payment: {
          title: 'Conditions de Paiement',
          icon: <CreditCard className="w-5 h-5" />,
          summary: 'Paiement sécurisé avec plusieurs options disponibles',
          details: {
            methods: 'Cartes bancaires, PayPal, virement bancaire acceptés',
            security: 'Paiements sécurisés SSL avec cryptage 256-bit',
            deposit: 'Acompte de 30% à la réservation, solde à l\'arrivée',
            currency: 'Paiements acceptés en DZD, EUR, USD',
            refund: 'Remboursements traités sous 3-5 jours ouvrables'
          }
        },
        checkin: {
          title: 'Arrivée et Départ',
          icon: <Clock className="w-5 h-5" />,
          summary: 'Check-in flexible avec accès autonome 24h/24',
          details: {
            checkinTime: 'Arrivée: 15h00 - 22h00 (accès tardif possible)',
            checkoutTime: 'Départ: avant 11h00 (départ tardif sur demande)',
            keyless: 'Accès sans clé via code électronique',
            luggage: 'Service de consigne disponible gratuitement',
            earlyLate: 'Arrivée anticipée/départ tardif selon disponibilité'
          }
        },
        house: {
          title: 'Règlement Intérieur',
          icon: <FileText className="w-5 h-5" />,
          summary: 'Règles simples pour un séjour agréable pour tous',
          details: {
            noise: 'Respect du calme après 22h00',
            smoking: 'Interdiction de fumer à l\'intérieur',
            pets: 'Animaux acceptés sur demande (supplément possible)',
            guests: 'Nombre maximum de personnes selon la capacité',
            damage: 'Responsabilité en cas de dommages'
          }
        }
      },
      guarantees: {
        title: 'Nos Garanties',
        items: [
          'Remboursement intégral si le loft ne correspond pas à la description',
          'Assistance 24h/24 pendant votre séjour',
          'Nettoyage professionnel entre chaque séjour',
          'Équipements fonctionnels garantis'
        ]
      }
    },
    en: {
      title: 'Transparent Policies',
      subtitle: 'Clear conditions for confident booking',
      policies: {
        cancellation: {
          title: 'Cancellation Policy',
          icon: <XCircle className="w-5 h-5" />,
          summary: 'Free cancellation up to 48h before arrival',
          details: {
            free: 'Free cancellation up to 48h before arrival',
            partial: '50% refund between 48h and 24h before arrival',
            noRefund: 'No refund less than 24h before arrival',
            exceptions: 'Exceptions for force majeure (illness, family emergency)',
            process: 'Automatic refund within 3-5 business days'
          }
        },
        payment: {
          title: 'Payment Terms',
          icon: <CreditCard className="w-5 h-5" />,
          summary: 'Secure payment with multiple options available',
          details: {
            methods: 'Credit cards, PayPal, bank transfer accepted',
            security: 'SSL secured payments with 256-bit encryption',
            deposit: '30% deposit at booking, balance on arrival',
            currency: 'Payments accepted in DZD, EUR, USD',
            refund: 'Refunds processed within 3-5 business days'
          }
        },
        checkin: {
          title: 'Check-in & Check-out',
          icon: <Clock className="w-5 h-5" />,
          summary: 'Flexible check-in with 24/7 autonomous access',
          details: {
            checkinTime: 'Check-in: 3:00 PM - 10:00 PM (late access possible)',
            checkoutTime: 'Check-out: before 11:00 AM (late checkout on request)',
            keyless: 'Keyless access via electronic code',
            luggage: 'Free luggage storage service available',
            earlyLate: 'Early arrival/late departure subject to availability'
          }
        },
        house: {
          title: 'House Rules',
          icon: <FileText className="w-5 h-5" />,
          summary: 'Simple rules for an enjoyable stay for everyone',
          details: {
            noise: 'Quiet hours after 10:00 PM',
            smoking: 'No smoking indoors',
            pets: 'Pets accepted on request (supplement may apply)',
            guests: 'Maximum number of people according to capacity',
            damage: 'Responsibility for damages'
          }
        }
      },
      guarantees: {
        title: 'Our Guarantees',
        items: [
          'Full refund if loft doesn\'t match description',
          '24/7 assistance during your stay',
          'Professional cleaning between each stay',
          'Guaranteed functional equipment'
        ]
      }
    },
    ar: {
      title: 'سياسات شفافة',
      subtitle: 'شروط واضحة للحجز بثقة',
      policies: {
        cancellation: {
          title: 'سياسة الإلغاء',
          icon: <XCircle className="w-5 h-5" />,
          summary: 'إلغاء مجاني حتى 48 ساعة قبل الوصول',
          details: {
            free: 'إلغاء مجاني حتى 48 ساعة قبل الوصول',
            partial: 'استرداد 50% بين 48 و 24 ساعة قبل الوصول',
            noRefund: 'لا يوجد استرداد أقل من 24 ساعة قبل الوصول',
            exceptions: 'استثناءات للقوة القاهرة (مرض، طوارئ عائلية)',
            process: 'استرداد تلقائي خلال 3-5 أيام عمل'
          }
        },
        payment: {
          title: 'شروط الدفع',
          icon: <CreditCard className="w-5 h-5" />,
          summary: 'دفع آمن مع خيارات متعددة متاحة',
          details: {
            methods: 'بطاقات ائتمان، PayPal، تحويل بنكي مقبول',
            security: 'مدفوعات آمنة SSL مع تشفير 256-bit',
            deposit: 'دفعة مقدمة 30% عند الحجز، الرصيد عند الوصول',
            currency: 'مدفوعات مقبولة بـ DZD، EUR، USD',
            refund: 'معالجة المبالغ المستردة خلال 3-5 أيام عمل'
          }
        },
        checkin: {
          title: 'الوصول والمغادرة',
          icon: <Clock className="w-5 h-5" />,
          summary: 'تسجيل وصول مرن مع وصول مستقل 24/7',
          details: {
            checkinTime: 'الوصول: 15:00 - 22:00 (وصول متأخر ممكن)',
            checkoutTime: 'المغادرة: قبل 11:00 (مغادرة متأخرة عند الطلب)',
            keyless: 'وصول بدون مفتاح عبر رمز إلكتروني',
            luggage: 'خدمة حفظ الأمتعة متاحة مجاناً',
            earlyLate: 'وصول مبكر/مغادرة متأخرة حسب التوفر'
          }
        },
        house: {
          title: 'قواعد المنزل',
          icon: <FileText className="w-5 h-5" />,
          summary: 'قواعد بسيطة لإقامة ممتعة للجميع',
          details: {
            noise: 'احترام الهدوء بعد 22:00',
            smoking: 'منع التدخين في الداخل',
            pets: 'الحيوانات الأليفة مقبولة عند الطلب (رسوم إضافية ممكنة)',
            guests: 'عدد أقصى من الأشخاص حسب السعة',
            damage: 'المسؤولية في حالة الأضرار'
          }
        }
      },
      guarantees: {
        title: 'ضماناتنا',
        items: [
          'استرداد كامل إذا لم يطابق اللوفت الوصف',
          'مساعدة 24/7 أثناء إقامتكم',
          'تنظيف مهني بين كل إقامة',
          'معدات وظيفية مضمونة'
        ]
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const togglePolicy = (policyKey: string) => {
    setExpandedPolicy(expandedPolicy === policyKey ? null : policyKey);
  };

  const policyColors = {
    cancellation: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    payment: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    checkin: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    house: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    }
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

      {/* Policies Grid */}
      <div className="space-y-4">
        {Object.entries(text.policies).map(([key, policy], index) => {
          const colors = policyColors[key as keyof typeof policyColors];
          const isExpanded = expandedPolicy === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${colors.border} overflow-hidden`}
            >
              {/* Policy Header */}
              <button
                onClick={() => togglePolicy(key)}
                className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <div className={colors.text}>
                        {policy.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {policy.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {policy.summary}
                      </p>
                    </div>
                  </div>
                  <div className={`${colors.text} transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* Policy Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${colors.bg} px-6 pb-6`}
                  >
                    <div className="space-y-3">
                      {Object.entries(policy.details).map(([detailKey, detail]) => (
                        <div key={detailKey} className="flex items-start space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Guarantees Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {text.guarantees.title}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {text.guarantees.items.map((guarantee, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {guarantee}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Information Importante
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Ces politiques peuvent être mises à jour. Les conditions applicables sont celles en vigueur au moment de votre réservation. 
              Pour toute question, notre équipe support est disponible 24h/24.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}