'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  CreditCard,
  Shield,
  Users,
  Wifi
} from 'lucide-react';

interface FAQSectionProps {
  locale: string;
}

export default function FAQSection({ locale }: FAQSectionProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const content = {
    fr: {
      title: 'Questions Fréquentes',
      subtitle: 'Trouvez rapidement les réponses à vos questions',
      searchPlaceholder: 'Rechercher une question...',
      categories: {
        booking: 'Réservation',
        payment: 'Paiement',
        checkin: 'Arrivée/Départ',
        amenities: 'Équipements',
        policies: 'Politiques',
        support: 'Support'
      },
      faqs: {
        booking: [
          {
            question: 'Comment puis-je réserver un loft ?',
            answer: 'Vous pouvez réserver directement sur notre site en sélectionnant vos dates, le nombre de personnes et en choisissant votre loft préféré. Le processus de réservation est simple et sécurisé.'
          },
          {
            question: 'Puis-je modifier ma réservation ?',
            answer: 'Oui, vous pouvez modifier votre réservation jusqu\'à 48h avant votre arrivée sans frais. Pour les modifications de dernière minute, des frais peuvent s\'appliquer.'
          },
          {
            question: 'Que se passe-t-il si le loft n\'est pas disponible ?',
            answer: 'Si votre loft devient indisponible, nous vous proposerons immédiatement des alternatives similaires ou un remboursement intégral.'
          }
        ],
        payment: [
          {
            question: 'Quels moyens de paiement acceptez-vous ?',
            answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et les virements bancaires. Tous les paiements sont sécurisés avec un cryptage SSL.'
          },
          {
            question: 'Quand dois-je payer ?',
            answer: 'Un acompte de 30% est requis à la réservation. Le solde peut être payé à l\'arrivée ou en ligne avant votre séjour.'
          },
          {
            question: 'Y a-t-il des frais cachés ?',
            answer: 'Non, tous nos prix sont transparents. Les seuls frais supplémentaires possibles sont clairement indiqués (taxe de séjour, services optionnels).'
          }
        ],
        checkin: [
          {
            question: 'À quelle heure puis-je arriver ?',
            answer: 'L\'arrivée standard est entre 15h00 et 22h00. Un accès tardif est possible sur demande avec notre système de codes électroniques.'
          },
          {
            question: 'Comment récupérer les clés ?',
            answer: 'Nous utilisons un système d\'accès sans clé avec des codes électroniques. Vous recevrez vos codes par SMS et email avant votre arrivée.'
          },
          {
            question: 'Puis-je laisser mes bagages avant le check-in ?',
            answer: 'Oui, nous proposons un service de consigne gratuit si vous arrivez avant l\'heure de check-in.'
          }
        ],
        amenities: [
          {
            question: 'Le WiFi est-il inclus ?',
            answer: 'Oui, tous nos lofts disposent d\'une connexion WiFi haut débit gratuite et illimitée.'
          },
          {
            question: 'Y a-t-il une cuisine équipée ?',
            answer: 'Tous nos lofts disposent d\'une cuisine entièrement équipée avec réfrigérateur, plaques de cuisson, micro-ondes et ustensiles de base.'
          },
          {
            question: 'Le parking est-il disponible ?',
            answer: 'La plupart de nos lofts disposent d\'un parking gratuit. Les détails sont spécifiés dans la description de chaque propriété.'
          }
        ],
        policies: [
          {
            question: 'Quelle est votre politique d\'annulation ?',
            answer: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée. Entre 48h et 24h : remboursement de 50%. Moins de 24h : aucun remboursement sauf cas de force majeure.'
          },
          {
            question: 'Les animaux sont-ils acceptés ?',
            answer: 'Les animaux sont acceptés dans certains lofts sur demande préalable. Un supplément de nettoyage peut s\'appliquer.'
          },
          {
            question: 'Puis-je fumer dans le loft ?',
            answer: 'Non, tous nos lofts sont non-fumeurs. Des espaces extérieurs sont disponibles dans la plupart des propriétés.'
          }
        ],
        support: [
          {
            question: 'Comment vous contacter en cas d\'urgence ?',
            answer: 'Notre ligne d\'urgence 24h/24 est disponible au +213 XXX XXX XXX. Vous pouvez aussi nous contacter via le chat en direct sur notre site.'
          },
          {
            question: 'Que faire en cas de problème dans le loft ?',
            answer: 'Contactez-nous immédiatement via notre ligne d\'urgence. Nous intervenons rapidement pour résoudre tout problème technique ou de confort.'
          },
          {
            question: 'Proposez-vous des services de conciergerie ?',
            answer: 'Oui, notre équipe peut vous aider avec les réservations de restaurants, transports, activités touristiques et autres services locaux.'
          }
        ]
      },
      stillNeedHelp: 'Vous ne trouvez pas votre réponse ?',
      contactSupport: 'Contactez notre support'
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find quick answers to your questions',
      searchPlaceholder: 'Search for a question...',
      categories: {
        booking: 'Booking',
        payment: 'Payment',
        checkin: 'Check-in/out',
        amenities: 'Amenities',
        policies: 'Policies',
        support: 'Support'
      },
      faqs: {
        booking: [
          {
            question: 'How can I book a loft?',
            answer: 'You can book directly on our website by selecting your dates, number of guests, and choosing your preferred loft. The booking process is simple and secure.'
          },
          {
            question: 'Can I modify my reservation?',
            answer: 'Yes, you can modify your reservation up to 48h before arrival at no charge. Last-minute changes may incur fees.'
          },
          {
            question: 'What happens if the loft is not available?',
            answer: 'If your loft becomes unavailable, we will immediately offer similar alternatives or a full refund.'
          }
        ],
        payment: [
          {
            question: 'What payment methods do you accept?',
            answer: 'We accept credit cards (Visa, Mastercard), PayPal, and bank transfers. All payments are secured with SSL encryption.'
          },
          {
            question: 'When do I need to pay?',
            answer: 'A 30% deposit is required at booking. The balance can be paid on arrival or online before your stay.'
          },
          {
            question: 'Are there any hidden fees?',
            answer: 'No, all our prices are transparent. The only possible additional fees are clearly indicated (tourist tax, optional services).'
          }
        ],
        checkin: [
          {
            question: 'What time can I arrive?',
            answer: 'Standard check-in is between 3:00 PM and 10:00 PM. Late access is possible on request with our electronic code system.'
          },
          {
            question: 'How do I get the keys?',
            answer: 'We use a keyless access system with electronic codes. You will receive your codes via SMS and email before arrival.'
          },
          {
            question: 'Can I leave my luggage before check-in?',
            answer: 'Yes, we offer free luggage storage if you arrive before check-in time.'
          }
        ],
        amenities: [
          {
            question: 'Is WiFi included?',
            answer: 'Yes, all our lofts have free unlimited high-speed WiFi.'
          },
          {
            question: 'Is there a fully equipped kitchen?',
            answer: 'All our lofts have a fully equipped kitchen with refrigerator, stovetop, microwave, and basic utensils.'
          },
          {
            question: 'Is parking available?',
            answer: 'Most of our lofts have free parking. Details are specified in each property description.'
          }
        ],
        policies: [
          {
            question: 'What is your cancellation policy?',
            answer: 'Free cancellation up to 48h before arrival. Between 48h and 24h: 50% refund. Less than 24h: no refund except force majeure.'
          },
          {
            question: 'Are pets allowed?',
            answer: 'Pets are accepted in certain lofts upon prior request. A cleaning supplement may apply.'
          },
          {
            question: 'Can I smoke in the loft?',
            answer: 'No, all our lofts are non-smoking. Outdoor spaces are available in most properties.'
          }
        ],
        support: [
          {
            question: 'How to contact you in case of emergency?',
            answer: 'Our 24/7 emergency line is available at +213 XXX XXX XXX. You can also contact us via live chat on our website.'
          },
          {
            question: 'What to do in case of a problem in the loft?',
            answer: 'Contact us immediately via our emergency line. We respond quickly to resolve any technical or comfort issues.'
          },
          {
            question: 'Do you offer concierge services?',
            answer: 'Yes, our team can help with restaurant reservations, transportation, tourist activities, and other local services.'
          }
        ]
      },
      stillNeedHelp: 'Can\'t find your answer?',
      contactSupport: 'Contact our support'
    },
    ar: {
      title: 'الأسئلة الشائعة',
      subtitle: 'اعثر على إجابات سريعة لأسئلتك',
      searchPlaceholder: 'البحث عن سؤال...',
      categories: {
        booking: 'الحجز',
        payment: 'الدفع',
        checkin: 'الوصول/المغادرة',
        amenities: 'المرافق',
        policies: 'السياسات',
        support: 'الدعم'
      },
      faqs: {
        booking: [
          {
            question: 'كيف يمكنني حجز لوفت؟',
            answer: 'يمكنك الحجز مباشرة على موقعنا عبر اختيار تواريخك وعدد الضيوف واختيار اللوفت المفضل. عملية الحجز بسيطة وآمنة.'
          },
          {
            question: 'هل يمكنني تعديل حجزي؟',
            answer: 'نعم، يمكنك تعديل حجزك حتى 48 ساعة قبل الوصول بدون رسوم. التعديلات اللحظية قد تتطلب رسوماً.'
          },
          {
            question: 'ماذا يحدث إذا لم يكن اللوفت متاحاً؟',
            answer: 'إذا أصبح لوفتك غير متاح، سنقدم لك فوراً بدائل مماثلة أو استرداد كامل.'
          }
        ],
        payment: [
          {
            question: 'ما هي طرق الدفع المقبولة؟',
            answer: 'نقبل البطاقات الائتمانية (فيزا، ماستركارد)، PayPal، والتحويلات البنكية. جميع المدفوعات مؤمنة بتشفير SSL.'
          },
          {
            question: 'متى يجب أن أدفع؟',
            answer: 'مطلوب دفعة مقدمة 30% عند الحجز. يمكن دفع الرصيد عند الوصول أو عبر الإنترنت قبل إقامتك.'
          },
          {
            question: 'هل هناك رسوم مخفية؟',
            answer: 'لا، جميع أسعارنا شفافة. الرسوم الإضافية الوحيدة المحتملة محددة بوضوح (ضريبة السياحة، خدمات اختيارية).'
          }
        ],
        checkin: [
          {
            question: 'في أي وقت يمكنني الوصول؟',
            answer: 'تسجيل الوصول المعياري بين 15:00 و 22:00. الوصول المتأخر ممكن عند الطلب مع نظام الرموز الإلكترونية.'
          },
          {
            question: 'كيف أحصل على المفاتيح؟',
            answer: 'نستخدم نظام وصول بدون مفاتيح مع رموز إلكترونية. ستتلقى رموزك عبر SMS والبريد الإلكتروني قبل الوصول.'
          },
          {
            question: 'هل يمكنني ترك أمتعتي قبل تسجيل الوصول؟',
            answer: 'نعم، نقدم خدمة حفظ الأمتعة مجاناً إذا وصلت قبل وقت تسجيل الوصول.'
          }
        ],
        amenities: [
          {
            question: 'هل الواي فاي مشمول؟',
            answer: 'نعم، جميع لوفتاتنا تحتوي على واي فاي عالي السرعة مجاني وغير محدود.'
          },
          {
            question: 'هل يوجد مطبخ مجهز بالكامل؟',
            answer: 'جميع لوفتاتنا تحتوي على مطبخ مجهز بالكامل مع ثلاجة وموقد وميكروويف وأدوات أساسية.'
          },
          {
            question: 'هل موقف السيارات متاح؟',
            answer: 'معظم لوفتاتنا تحتوي على موقف سيارات مجاني. التفاصيل محددة في وصف كل عقار.'
          }
        ],
        policies: [
          {
            question: 'ما هي سياسة الإلغاء؟',
            answer: 'إلغاء مجاني حتى 48 ساعة قبل الوصول. بين 48 و 24 ساعة: استرداد 50%. أقل من 24 ساعة: لا استرداد إلا للقوة القاهرة.'
          },
          {
            question: 'هل الحيوانات الأليفة مسموحة؟',
            answer: 'الحيوانات الأليفة مقبولة في لوفتات معينة عند الطلب المسبق. قد تطبق رسوم تنظيف إضافية.'
          },
          {
            question: 'هل يمكنني التدخين في اللوفت؟',
            answer: 'لا، جميع لوفتاتنا خالية من التدخين. المساحات الخارجية متاحة في معظم العقارات.'
          }
        ],
        support: [
          {
            question: 'كيف أتواصل معكم في حالة الطوارئ؟',
            answer: 'خط الطوارئ 24/7 متاح على +213 XXX XXX XXX. يمكنك أيضاً التواصل عبر الدردشة المباشرة على موقعنا.'
          },
          {
            question: 'ماذا أفعل في حالة مشكلة في اللوفت؟',
            answer: 'اتصل بنا فوراً عبر خط الطوارئ. نستجيب بسرعة لحل أي مشاكل تقنية أو راحة.'
          },
          {
            question: 'هل تقدمون خدمات الكونسيرج؟',
            answer: 'نعم، فريقنا يمكنه المساعدة في حجوزات المطاعم والنقل والأنشطة السياحية وخدمات محلية أخرى.'
          }
        ]
      },
      stillNeedHelp: 'لا تجد إجابتك؟',
      contactSupport: 'اتصل بدعمنا'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const toggleFAQ = (category: string, index: number) => {
    const faqKey = `${category}-${index}`;
    setExpandedFAQ(expandedFAQ === faqKey ? null : faqKey);
  };

  const categoryIcons = {
    booking: <Calendar className="w-5 h-5" />,
    payment: <CreditCard className="w-5 h-5" />,
    checkin: <Clock className="w-5 h-5" />,
    amenities: <Wifi className="w-5 h-5" />,
    policies: <Shield className="w-5 h-5" />,
    support: <MessageCircle className="w-5 h-5" />
  };

  const categoryColors = {
    booking: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    payment: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    checkin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amenities: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    policies: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    support: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
  };

  // Filter FAQs based on search term
  const filteredFAQs = Object.entries(text.faqs).reduce((acc, [category, faqs]) => {
    const filtered = faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof text.faqs.booking>);

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

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={text.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </motion.div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {Object.entries(filteredFAQs).map(([category, faqs], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Category Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[category as keyof typeof categoryColors]}`}>
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {text.categories[category as keyof typeof text.categories]}
                </h4>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
                  {faqs.length}
                </span>
              </div>
            </div>

            {/* FAQ Items */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.map((faq, index) => {
                const faqKey = `${category}-${index}`;
                const isExpanded = expandedFAQ === faqKey;

                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleFAQ(category, index)}
                      className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <h5 className="font-medium text-gray-900 dark:text-white pr-4">
                            {faq.question}
                          </h5>
                        </div>
                        <div className="text-gray-400 transition-transform duration-200">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-6"
                        >
                          <div className="ml-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contact Support CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800"
      >
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {text.stillNeedHelp}
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Notre équipe support est disponible 24h/24 pour vous aider
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Chat en direct</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>{text.contactSupport}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}