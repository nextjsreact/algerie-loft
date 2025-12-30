'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  CreditCard, 
  Wallet, 
  QrCode, 
  NfcIcon,
  CheckCircle,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MobilePaymentMethodsProps {
  locale: string;
  amount: number;
  currency: string;
  onMethodSelect: (method: PaymentMethodOption) => void;
  selectedMethod?: string;
}

interface PaymentMethodOption {
  id: string;
  name: string;
  type: 'mobile_wallet' | 'card_tap' | 'qr_code' | 'nfc' | 'biometric';
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  securityLevel: 'high' | 'medium' | 'low';
  availability: 'available' | 'coming_soon' | 'unavailable';
  features: string[];
  fees: number;
  isRecommended?: boolean;
  requiresApp?: boolean;
  supportedDevices?: string[];
}

/**
 * Mobile-optimized payment methods component
 * Focuses on mobile-first payment options
 */
export default function MobilePaymentMethods({
  locale,
  amount,
  currency,
  onMethodSelect,
  selectedMethod
}: MobilePaymentMethodsProps) {
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  // Multilingual content
  const content = {
    fr: {
      title: "Méthodes de paiement mobile",
      subtitle: "Choisissez votre méthode préférée",
      recommended: "Recommandé",
      comingSoon: "Bientôt disponible",
      unavailable: "Indisponible",
      features: "Fonctionnalités",
      security: "Sécurité",
      processingTime: "Temps de traitement",
      fees: "Frais",
      free: "Gratuit",
      requiresApp: "Nécessite l'application",
      supportedDevices: "Appareils supportés",
      methods: {
        mobile_wallet: {
          name: "Portefeuille mobile",
          description: "Paiement rapide avec votre portefeuille numérique",
          features: ["Paiement instantané", "Sécurisé par biométrie", "Historique des transactions"]
        },
        card_tap: {
          name: "Paiement sans contact",
          description: "Approchez votre carte ou téléphone du terminal",
          features: ["Sans contact", "Rapide et sûr", "Compatible NFC"]
        },
        qr_code: {
          name: "Code QR",
          description: "Scannez pour payer instantanément",
          features: ["Scan rapide", "Pas d'application requise", "Sécurisé"]
        },
        nfc: {
          name: "Paiement NFC",
          description: "Paiement par proximité avec votre téléphone",
          features: ["Technologie NFC", "Authentification biométrique", "Instantané"]
        },
        biometric: {
          name: "Paiement biométrique",
          description: "Payez avec votre empreinte ou reconnaissance faciale",
          features: ["Empreinte digitale", "Reconnaissance faciale", "Ultra sécurisé"]
        }
      },
      securityLevels: {
        high: "Élevée",
        medium: "Moyenne",
        low: "Faible"
      },
      select: "Sélectionner",
      selected: "Sélectionné",
      learnMore: "En savoir plus"
    },
    en: {
      title: "Mobile payment methods",
      subtitle: "Choose your preferred method",
      recommended: "Recommended",
      comingSoon: "Coming soon",
      unavailable: "Unavailable",
      features: "Features",
      security: "Security",
      processingTime: "Processing time",
      fees: "Fees",
      free: "Free",
      requiresApp: "Requires app",
      supportedDevices: "Supported devices",
      methods: {
        mobile_wallet: {
          name: "Mobile wallet",
          description: "Quick payment with your digital wallet",
          features: ["Instant payment", "Biometric security", "Transaction history"]
        },
        card_tap: {
          name: "Contactless payment",
          description: "Tap your card or phone on the terminal",
          features: ["Contactless", "Fast and secure", "NFC compatible"]
        },
        qr_code: {
          name: "QR Code",
          description: "Scan to pay instantly",
          features: ["Quick scan", "No app required", "Secure"]
        },
        nfc: {
          name: "NFC Payment",
          description: "Proximity payment with your phone",
          features: ["NFC technology", "Biometric authentication", "Instant"]
        },
        biometric: {
          name: "Biometric payment",
          description: "Pay with your fingerprint or face recognition",
          features: ["Fingerprint", "Face recognition", "Ultra secure"]
        }
      },
      securityLevels: {
        high: "High",
        medium: "Medium",
        low: "Low"
      },
      select: "Select",
      selected: "Selected",
      learnMore: "Learn more"
    },
    ar: {
      title: "طرق الدفع المحمولة",
      subtitle: "اختر طريقتك المفضلة",
      recommended: "موصى به",
      comingSoon: "قريباً",
      unavailable: "غير متاح",
      features: "الميزات",
      security: "الأمان",
      processingTime: "وقت المعالجة",
      fees: "الرسوم",
      free: "مجاني",
      requiresApp: "يتطلب التطبيق",
      supportedDevices: "الأجهزة المدعومة",
      methods: {
        mobile_wallet: {
          name: "محفظة محمولة",
          description: "دفع سريع بمحفظتك الرقمية",
          features: ["دفع فوري", "أمان بيومتري", "تاريخ المعاملات"]
        },
        card_tap: {
          name: "دفع بدون تلامس",
          description: "اقترب بالبطاقة أو الهاتف من الجهاز",
          features: ["بدون تلامس", "سريع وآمن", "متوافق مع NFC"]
        },
        qr_code: {
          name: "رمز QR",
          description: "امسح للدفع فوراً",
          features: ["مسح سريع", "لا يتطلب تطبيق", "آمن"]
        },
        nfc: {
          name: "دفع NFC",
          description: "دفع بالقرب بهاتفك",
          features: ["تقنية NFC", "مصادقة بيومترية", "فوري"]
        },
        biometric: {
          name: "دفع بيومتري",
          description: "ادفع ببصمتك أو التعرف على الوجه",
          features: ["بصمة الإصبع", "التعرف على الوجه", "فائق الأمان"]
        }
      },
      securityLevels: {
        high: "عالي",
        medium: "متوسط",
        low: "منخفض"
      },
      select: "اختيار",
      selected: "مختار",
      learnMore: "اعرف المزيد"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Payment method options optimized for mobile
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'mobile_wallet',
      name: text.methods.mobile_wallet.name,
      type: 'mobile_wallet',
      icon: <Wallet className="w-6 h-6" />,
      description: text.methods.mobile_wallet.description,
      processingTime: "< 30s",
      securityLevel: 'high',
      availability: 'available',
      features: text.methods.mobile_wallet.features,
      fees: 0,
      isRecommended: true,
      requiresApp: true,
      supportedDevices: ['iOS', 'Android']
    },
    {
      id: 'card_tap',
      name: text.methods.card_tap.name,
      type: 'card_tap',
      icon: <CreditCard className="w-6 h-6" />,
      description: text.methods.card_tap.description,
      processingTime: "< 10s",
      securityLevel: 'high',
      availability: 'available',
      features: text.methods.card_tap.features,
      fees: 0,
      requiresApp: false,
      supportedDevices: ['NFC-enabled devices']
    },
    {
      id: 'qr_code',
      name: text.methods.qr_code.name,
      type: 'qr_code',
      icon: <QrCode className="w-6 h-6" />,
      description: text.methods.qr_code.description,
      processingTime: "< 15s",
      securityLevel: 'medium',
      availability: 'available',
      features: text.methods.qr_code.features,
      fees: 0,
      requiresApp: false,
      supportedDevices: ['Any smartphone']
    },
    {
      id: 'nfc',
      name: text.methods.nfc.name,
      type: 'nfc',
      icon: <NfcIcon className="w-6 h-6" />,
      description: text.methods.nfc.description,
      processingTime: "< 5s",
      securityLevel: 'high',
      availability: 'available',
      features: text.methods.nfc.features,
      fees: 0,
      requiresApp: true,
      supportedDevices: ['NFC-enabled smartphones']
    },
    {
      id: 'biometric',
      name: text.methods.biometric.name,
      type: 'biometric',
      icon: <Smartphone className="w-6 h-6" />,
      description: text.methods.biometric.description,
      processingTime: "< 3s",
      securityLevel: 'high',
      availability: 'coming_soon',
      features: text.methods.biometric.features,
      fees: 0,
      requiresApp: true,
      supportedDevices: ['iPhone X+', 'Android 9+']
    }
  ];

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'coming_soon': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return '';
      case 'coming_soon': return text.comingSoon;
      case 'unavailable': return text.unavailable;
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {text.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {text.subtitle}
        </p>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {amount} {currency}
          </p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="space-y-4">
        {paymentMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : method.availability === 'available'
                    ? 'hover:shadow-lg hover:scale-[1.02]'
                    : 'opacity-60'
              }`}
              onClick={() => {
                if (method.availability === 'available') {
                  onMethodSelect(method);
                  setExpandedMethod(expandedMethod === method.id ? null : method.id);
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${
                      method.availability === 'available' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {method.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        {method.isRecommended && method.availability === 'available' && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {text.recommended}
                          </Badge>
                        )}
                        {method.availability !== 'available' && (
                          <Badge variant="outline" className={`text-xs ${getAvailabilityColor(method.availability)}`}>
                            {getAvailabilityText(method.availability)}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {method.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {selectedMethod === method.id ? (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{method.processingTime}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Details */}
              {expandedMethod === method.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Features */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-1" />
                          {text.features}
                        </h4>
                        <ul className="space-y-1">
                          {method.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center">
                              <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Technical Details */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              {text.security}:
                            </span>
                            <Badge className={`text-xs ${getSecurityColor(method.securityLevel)}`}>
                              {text.securityLevels[method.securityLevel]}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">{text.fees}: </span>
                          <span className="font-medium text-green-600">
                            {method.fees === 0 ? text.free : `${method.fees} ${currency}`}
                          </span>
                        </div>

                        {method.requiresApp && (
                          <div className="text-xs text-muted-foreground">
                            📱 {text.requiresApp}
                          </div>
                        )}

                        {method.supportedDevices && (
                          <div className="text-xs text-muted-foreground">
                            <span>{text.supportedDevices}: </span>
                            <span>{method.supportedDevices.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {method.availability === 'available' && selectedMethod !== method.id && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMethodSelect(method);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          {text.select}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
            <Shield className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Paiement sécurisé</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Toutes les transactions sont cryptées et sécurisées selon les standards bancaires.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}