'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MessageCircle, HelpCircle, Clock, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContactForm } from '@/components/forms/contact-form';
import { LiveChatWidget } from './LiveChatWidget';
import { EmergencyContactModal } from './EmergencyContactModal';
import { SupportAvailabilityIndicator } from './SupportAvailabilityIndicator';

interface ContextualSupportSystemProps {
  locale: string;
  userContext?: {
    isGuest?: boolean;
    currentAction?: 'browsing' | 'booking' | 'searching' | 'viewing_loft' | 'checkout';
    loftId?: string;
    bookingId?: string;
  };
  className?: string;
}

interface SupportChannel {
  id: string;
  type: 'phone' | 'email' | 'chat' | 'emergency';
  title: string;
  description: string;
  icon: React.ReactNode;
  availability: string;
  responseTime: string;
  rating: number;
  isAvailable: boolean;
  priority: number;
}

/**
 * Contextual customer support system with multi-channel options
 * Provides contextual help based on user's current action
 */
export default function ContextualSupportSystem({ 
  locale, 
  userContext = { isGuest: true, currentAction: 'browsing' },
  className = ''
}: ContextualSupportSystemProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      title: "Comment pouvons-nous vous aider ?",
      subtitle: "Choisissez le canal de communication qui vous convient le mieux",
      contextualHelp: {
        browsing: "Vous explorez nos lofts ? Nos experts peuvent vous guider vers le loft parfait.",
        booking: "Besoin d'aide pour votre réservation ? Notre équipe est là pour vous accompagner.",
        searching: "Vous cherchez quelque chose de spécifique ? Laissez-nous vous aider à trouver.",
        viewing_loft: "Des questions sur ce loft ? Contactez-nous pour plus d'informations.",
        checkout: "Problème lors du paiement ? Notre support technique peut vous aider immédiatement."
      },
      channels: {
        phone: {
          title: "Téléphone",
          description: "Parlez directement avec nos conseillers",
          availability: "Lun-Dim 8h-22h",
          responseTime: "Immédiat"
        },
        email: {
          title: "Email",
          description: "Envoyez-nous votre demande détaillée",
          availability: "24/7",
          responseTime: "2-4 heures"
        },
        chat: {
          title: "Chat en direct",
          description: "Assistance instantanée par chat",
          availability: "24/7",
          responseTime: "< 2 minutes"
        },
        emergency: {
          title: "Urgence",
          description: "Pour les clients actuels en cas d'urgence",
          availability: "24/7",
          responseTime: "Immédiat"
        }
      },
      ratings: {
        excellent: "Excellent",
        good: "Bon",
        average: "Moyen"
      },
      actions: {
        call: "Appeler maintenant",
        email: "Envoyer un email",
        chat: "Démarrer le chat",
        emergency: "Contact d'urgence"
      }
    },
    en: {
      title: "How can we help you?",
      subtitle: "Choose the communication channel that suits you best",
      contextualHelp: {
        browsing: "Exploring our lofts? Our experts can guide you to the perfect loft.",
        booking: "Need help with your booking? Our team is here to assist you.",
        searching: "Looking for something specific? Let us help you find it.",
        viewing_loft: "Questions about this loft? Contact us for more information.",
        checkout: "Payment issue? Our technical support can help you immediately."
      },
      channels: {
        phone: {
          title: "Phone",
          description: "Speak directly with our advisors",
          availability: "Mon-Sun 8am-10pm",
          responseTime: "Immediate"
        },
        email: {
          title: "Email", 
          description: "Send us your detailed request",
          availability: "24/7",
          responseTime: "2-4 hours"
        },
        chat: {
          title: "Live Chat",
          description: "Instant assistance via chat",
          availability: "24/7",
          responseTime: "< 2 minutes"
        },
        emergency: {
          title: "Emergency",
          description: "For current guests in case of emergency",
          availability: "24/7",
          responseTime: "Immediate"
        }
      },
      ratings: {
        excellent: "Excellent",
        good: "Good", 
        average: "Average"
      },
      actions: {
        call: "Call now",
        email: "Send email",
        chat: "Start chat",
        emergency: "Emergency contact"
      }
    },
    ar: {
      title: "كيف يمكننا مساعدتك؟",
      subtitle: "اختر قناة التواصل التي تناسبك",
      contextualHelp: {
        browsing: "تتصفح شققنا؟ يمكن لخبرائنا إرشادك إلى الشقة المثالية.",
        booking: "تحتاج مساعدة في حجزك؟ فريقنا هنا لمساعدتك.",
        searching: "تبحث عن شيء محدد؟ دعنا نساعدك في العثور عليه.",
        viewing_loft: "أسئلة حول هذه الشقة؟ اتصل بنا للمزيد من المعلومات.",
        checkout: "مشكلة في الدفع؟ يمكن لدعمنا التقني مساعدتك فوراً."
      },
      channels: {
        phone: {
          title: "هاتف",
          description: "تحدث مباشرة مع مستشارينا",
          availability: "الإثنين-الأحد 8ص-10م",
          responseTime: "فوري"
        },
        email: {
          title: "بريد إلكتروني",
          description: "أرسل لنا طلبك المفصل",
          availability: "24/7",
          responseTime: "2-4 ساعات"
        },
        chat: {
          title: "دردشة مباشرة",
          description: "مساعدة فورية عبر الدردشة",
          availability: "24/7",
          responseTime: "< 2 دقائق"
        },
        emergency: {
          title: "طوارئ",
          description: "للضيوف الحاليين في حالة الطوارئ",
          availability: "24/7",
          responseTime: "فوري"
        }
      },
      ratings: {
        excellent: "ممتاز",
        good: "جيد",
        average: "متوسط"
      },
      actions: {
        call: "اتصل الآن",
        email: "أرسل بريد إلكتروني",
        chat: "ابدأ الدردشة",
        emergency: "اتصال طوارئ"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Get contextual help message based on user's current action
  const getContextualMessage = () => {
    if (!userContext.currentAction) return '';
    return text.contextualHelp[userContext.currentAction] || '';
  };

  // Support channels with availability and ratings
  const supportChannels: SupportChannel[] = [
    {
      id: 'phone',
      type: 'phone',
      title: text.channels.phone.title,
      description: text.channels.phone.description,
      icon: <Phone className="w-6 h-6" />,
      availability: text.channels.phone.availability,
      responseTime: text.channels.phone.responseTime,
      rating: 4.8,
      isAvailable: true,
      priority: userContext.currentAction === 'checkout' ? 1 : 2
    },
    {
      id: 'chat',
      type: 'chat',
      title: text.channels.chat.title,
      description: text.channels.chat.description,
      icon: <MessageCircle className="w-6 h-6" />,
      availability: text.channels.chat.availability,
      responseTime: text.channels.chat.responseTime,
      rating: 4.9,
      isAvailable: true,
      priority: userContext.currentAction === 'booking' ? 1 : 2
    },
    {
      id: 'email',
      type: 'email',
      title: text.channels.email.title,
      description: text.channels.email.description,
      icon: <Mail className="w-6 h-6" />,
      availability: text.channels.email.availability,
      responseTime: text.channels.email.responseTime,
      rating: 4.7,
      isAvailable: true,
      priority: 3
    },
    {
      id: 'emergency',
      type: 'emergency',
      title: text.channels.emergency.title,
      description: text.channels.emergency.description,
      icon: <AlertTriangle className="w-6 h-6" />,
      availability: text.channels.emergency.availability,
      responseTime: text.channels.emergency.responseTime,
      rating: 5.0,
      isAvailable: true,
      priority: userContext.bookingId ? 1 : 4
    }
  ].sort((a, b) => a.priority - b.priority);

  const handleChannelSelect = (channel: SupportChannel) => {
    setSelectedChannel(channel.id);
    
    switch (channel.type) {
      case 'phone':
        // Open phone dialer
        window.location.href = 'tel:+213XXXXXXXX';
        break;
      case 'email':
        setShowContactForm(true);
        break;
      case 'chat':
        setShowLiveChat(true);
        break;
      case 'emergency':
        setShowEmergencyModal(true);
        break;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.8) return 'text-green-600';
    if (rating >= 4.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.8) return text.ratings.excellent;
    if (rating >= 4.5) return text.ratings.good;
    return text.ratings.average;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contextual Help Message */}
      {getContextualMessage() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              {getContextualMessage()}
            </p>
          </div>
        </motion.div>
      )}

      {/* Support Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supportChannels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedChannel === channel.id ? 'ring-2 ring-blue-500' : ''
              } ${!channel.isAvailable ? 'opacity-60' : ''}`}
              onClick={() => channel.isAvailable && handleChannelSelect(channel)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      channel.type === 'emergency' ? 'bg-red-100 text-red-600' :
                      channel.type === 'chat' ? 'bg-green-100 text-green-600' :
                      channel.type === 'phone' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {channel.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <SupportAvailabilityIndicator 
                          isAvailable={channel.isAvailable}
                          size="sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          {channel.availability}
                        </span>
                      </div>
                    </div>
                  </div>
                  {channel.priority === 1 && (
                    <Badge variant="secondary" className="text-xs">
                      Recommandé
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {channel.description}
                </CardDescription>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {channel.responseTime}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className={`w-4 h-4 ${getRatingColor(channel.rating)}`} />
                    <span className={`font-medium ${getRatingColor(channel.rating)}`}>
                      {channel.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({getRatingText(channel.rating)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowContactForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {text.actions.email}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContactForm(false)}
                  >
                    ✕
                  </Button>
                </div>
                <ContactForm 
                  showTitle={false}
                  onSubmit={async (data) => {
                    // Add context information to the form data
                    const contextualData = {
                      ...data,
                      context: {
                        userAction: userContext.currentAction,
                        loftId: userContext.loftId,
                        bookingId: userContext.bookingId,
                        timestamp: new Date().toISOString()
                      }
                    };
                    
                    const response = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contextualData)
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to send message');
                    }
                    
                    setShowContactForm(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Chat Widget */}
      <LiveChatWidget
        isOpen={showLiveChat}
        onClose={() => setShowLiveChat(false)}
        locale={locale}
        userContext={userContext}
      />

      {/* Emergency Contact Modal */}
      <EmergencyContactModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        locale={locale}
        userContext={userContext}
      />
    </div>
  );
}