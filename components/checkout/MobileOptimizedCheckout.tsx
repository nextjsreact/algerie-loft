'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MobileOptimizedCheckoutProps {
  locale: string;
  bookingData: {
    loftId: string;
    loftName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    currency: string;
  };
  onPaymentComplete: (paymentData: any) => void;
  onCancel: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile' | 'bank' | 'wallet';
  name: string;
  icon: string;
  description: string;
  processingTime: string;
  fees: number;
  isPopular?: boolean;
  isMobileOptimized?: boolean;
}

interface CheckoutStep {
  id: string;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

/**
 * Mobile-optimized checkout component with simplified payment flow
 */
export default function MobileOptimizedCheckout({
  locale,
  bookingData,
  onPaymentComplete,
  onCancel
}: MobileOptimizedCheckoutProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    phoneNumber: '',
    bankAccount: '',
    walletId: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      title: "Finaliser votre réservation",
      subtitle: "Paiement sécurisé et rapide",
      steps: [
        { id: 'method', title: 'Méthode de paiement' },
        { id: 'details', title: 'Détails de paiement' },
        { id: 'confirmation', title: 'Confirmation' }
      ],
      paymentMethods: {
        card: {
          name: "Carte bancaire",
          description: "Visa, Mastercard, CIB",
          processingTime: "Instantané"
        },
        mobile: {
          name: "Paiement mobile",
          description: "Mobilis Money, Djezzy Pay",
          processingTime: "< 2 minutes"
        },
        bank: {
          name: "Virement bancaire",
          description: "Transfert direct",
          processingTime: "1-2 jours"
        },
        wallet: {
          name: "Portefeuille numérique",
          description: "BaridiMob, SatimPay",
          processingTime: "Instantané"
        }
      },
      fields: {
        cardNumber: "Numéro de carte",
        expiryDate: "Date d'expiration",
        cvv: "Code CVV",
        cardholderName: "Nom du titulaire",
        phoneNumber: "Numéro de téléphone",
        bankAccount: "Numéro de compte",
        walletId: "ID du portefeuille"
      },
      placeholders: {
        cardNumber: "1234 5678 9012 3456",
        expiryDate: "MM/AA",
        cvv: "123",
        cardholderName: "Nom complet",
        phoneNumber: "+213 XX XX XX XX",
        bankAccount: "Numéro de compte bancaire",
        walletId: "ID ou numéro de portefeuille"
      },
      summary: {
        title: "Résumé de la réservation",
        loft: "Loft",
        dates: "Dates",
        guests: "Invités",
        subtotal: "Sous-total",
        fees: "Frais de service",
        total: "Total"
      },
      security: {
        title: "Paiement sécurisé",
        ssl: "Connexion SSL sécurisée",
        encryption: "Données cryptées",
        pci: "Conforme PCI DSS"
      },
      actions: {
        back: "Retour",
        continue: "Continuer",
        pay: "Payer maintenant",
        processing: "Traitement...",
        cancel: "Annuler"
      },
      terms: "J'accepte les conditions générales et la politique de confidentialité",
      success: {
        title: "Paiement réussi !",
        message: "Votre réservation a été confirmée",
        reference: "Référence de paiement"
      },
      errors: {
        required: "Ce champ est requis",
        invalidCard: "Numéro de carte invalide",
        invalidExpiry: "Date d'expiration invalide",
        invalidCvv: "Code CVV invalide",
        invalidPhone: "Numéro de téléphone invalide",
        paymentFailed: "Le paiement a échoué. Veuillez réessayer."
      }
    },
    en: {
      title: "Complete your booking",
      subtitle: "Secure and fast payment",
      steps: [
        { id: 'method', title: 'Payment method' },
        { id: 'details', title: 'Payment details' },
        { id: 'confirmation', title: 'Confirmation' }
      ],
      paymentMethods: {
        card: {
          name: "Credit/Debit Card",
          description: "Visa, Mastercard, CIB",
          processingTime: "Instant"
        },
        mobile: {
          name: "Mobile Payment",
          description: "Mobilis Money, Djezzy Pay",
          processingTime: "< 2 minutes"
        },
        bank: {
          name: "Bank Transfer",
          description: "Direct transfer",
          processingTime: "1-2 days"
        },
        wallet: {
          name: "Digital Wallet",
          description: "BaridiMob, SatimPay",
          processingTime: "Instant"
        }
      },
      fields: {
        cardNumber: "Card number",
        expiryDate: "Expiry date",
        cvv: "CVV code",
        cardholderName: "Cardholder name",
        phoneNumber: "Phone number",
        bankAccount: "Account number",
        walletId: "Wallet ID"
      },
      placeholders: {
        cardNumber: "1234 5678 9012 3456",
        expiryDate: "MM/YY",
        cvv: "123",
        cardholderName: "Full name",
        phoneNumber: "+213 XX XX XX XX",
        bankAccount: "Bank account number",
        walletId: "Wallet ID or number"
      },
      summary: {
        title: "Booking summary",
        loft: "Loft",
        dates: "Dates",
        guests: "Guests",
        subtotal: "Subtotal",
        fees: "Service fees",
        total: "Total"
      },
      security: {
        title: "Secure payment",
        ssl: "Secure SSL connection",
        encryption: "Encrypted data",
        pci: "PCI DSS compliant"
      },
      actions: {
        back: "Back",
        continue: "Continue",
        pay: "Pay now",
        processing: "Processing...",
        cancel: "Cancel"
      },
      terms: "I agree to the terms and conditions and privacy policy",
      success: {
        title: "Payment successful!",
        message: "Your booking has been confirmed",
        reference: "Payment reference"
      },
      errors: {
        required: "This field is required",
        invalidCard: "Invalid card number",
        invalidExpiry: "Invalid expiry date",
        invalidCvv: "Invalid CVV code",
        invalidPhone: "Invalid phone number",
        paymentFailed: "Payment failed. Please try again."
      }
    },
    ar: {
      title: "أكمل حجزك",
      subtitle: "دفع آمن وسريع",
      steps: [
        { id: 'method', title: 'طريقة الدفع' },
        { id: 'details', title: 'تفاصيل الدفع' },
        { id: 'confirmation', title: 'التأكيد' }
      ],
      paymentMethods: {
        card: {
          name: "بطاقة ائتمان/خصم",
          description: "فيزا، ماستركارد، CIB",
          processingTime: "فوري"
        },
        mobile: {
          name: "دفع محمول",
          description: "موبيليس موني، جيزي باي",
          processingTime: "< 2 دقائق"
        },
        bank: {
          name: "تحويل مصرفي",
          description: "تحويل مباشر",
          processingTime: "1-2 أيام"
        },
        wallet: {
          name: "محفظة رقمية",
          description: "باريدي موب، ساتيم باي",
          processingTime: "فوري"
        }
      },
      fields: {
        cardNumber: "رقم البطاقة",
        expiryDate: "تاريخ الانتهاء",
        cvv: "رمز CVV",
        cardholderName: "اسم حامل البطاقة",
        phoneNumber: "رقم الهاتف",
        bankAccount: "رقم الحساب",
        walletId: "معرف المحفظة"
      },
      placeholders: {
        cardNumber: "1234 5678 9012 3456",
        expiryDate: "MM/YY",
        cvv: "123",
        cardholderName: "الاسم الكامل",
        phoneNumber: "+213 XX XX XX XX",
        bankAccount: "رقم الحساب المصرفي",
        walletId: "معرف أو رقم المحفظة"
      },
      summary: {
        title: "ملخص الحجز",
        loft: "الشقة",
        dates: "التواريخ",
        guests: "الضيوف",
        subtotal: "المجموع الفرعي",
        fees: "رسوم الخدمة",
        total: "المجموع"
      },
      security: {
        title: "دفع آمن",
        ssl: "اتصال SSL آمن",
        encryption: "بيانات مشفرة",
        pci: "متوافق مع PCI DSS"
      },
      actions: {
        back: "رجوع",
        continue: "متابعة",
        pay: "ادفع الآن",
        processing: "جاري المعالجة...",
        cancel: "إلغاء"
      },
      terms: "أوافق على الشروط والأحكام وسياسة الخصوصية",
      success: {
        title: "تم الدفع بنجاح!",
        message: "تم تأكيد حجزك",
        reference: "مرجع الدفع"
      },
      errors: {
        required: "هذا الحقل مطلوب",
        invalidCard: "رقم بطاقة غير صحيح",
        invalidExpiry: "تاريخ انتهاء غير صحيح",
        invalidCvv: "رمز CVV غير صحيح",
        invalidPhone: "رقم هاتف غير صحيح",
        paymentFailed: "فشل الدفع. يرجى المحاولة مرة أخرى."
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Payment methods with mobile optimization
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'mobile',
      type: 'mobile',
      name: text.paymentMethods.mobile.name,
      icon: '📱',
      description: text.paymentMethods.mobile.description,
      processingTime: text.paymentMethods.mobile.processingTime,
      fees: 0,
      isPopular: true,
      isMobileOptimized: true
    },
    {
      id: 'card',
      type: 'card',
      name: text.paymentMethods.card.name,
      icon: '💳',
      description: text.paymentMethods.card.description,
      processingTime: text.paymentMethods.card.processingTime,
      fees: 0,
      isMobileOptimized: true
    },
    {
      id: 'wallet',
      type: 'wallet',
      name: text.paymentMethods.wallet.name,
      icon: '💰',
      description: text.paymentMethods.wallet.description,
      processingTime: text.paymentMethods.wallet.processingTime,
      fees: 0,
      isMobileOptimized: true
    },
    {
      id: 'bank',
      type: 'bank',
      name: text.paymentMethods.bank.name,
      icon: '🏦',
      description: text.paymentMethods.bank.description,
      processingTime: text.paymentMethods.bank.processingTime,
      fees: 0
    }
  ];

  const steps: CheckoutStep[] = text.steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    isCompleted: index < currentStep,
    isActive: index === currentStep
  }));

  // Calculate total with fees
  const serviceFees = selectedPaymentMethod ? 
    paymentMethods.find(m => m.id === selectedPaymentMethod)?.fees || 0 : 0;
  const totalAmount = bookingData.totalPrice + serviceFees;

  // Validation functions
  const validateCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiryDate = (date: string) => {
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test(date);
  };

  const validateCvv = (cvv: string) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validatePhoneNumber = (phone: string) => {
    return /^\+213\s?\d{9}$/.test(phone);
  };

  // Handle form validation
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!selectedPaymentMethod) {
        newErrors.paymentMethod = text.errors.required;
      }
    } else if (currentStep === 1) {
      const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (method?.type === 'card') {
        if (!paymentData.cardNumber) {
          newErrors.cardNumber = text.errors.required;
        } else if (!validateCardNumber(paymentData.cardNumber)) {
          newErrors.cardNumber = text.errors.invalidCard;
        }
        
        if (!paymentData.expiryDate) {
          newErrors.expiryDate = text.errors.required;
        } else if (!validateExpiryDate(paymentData.expiryDate)) {
          newErrors.expiryDate = text.errors.invalidExpiry;
        }
        
        if (!paymentData.cvv) {
          newErrors.cvv = text.errors.required;
        } else if (!validateCvv(paymentData.cvv)) {
          newErrors.cvv = text.errors.invalidCvv;
        }
        
        if (!paymentData.cardholderName) {
          newErrors.cardholderName = text.errors.required;
        }
      } else if (method?.type === 'mobile' || method?.type === 'wallet') {
        if (!paymentData.phoneNumber) {
          newErrors.phoneNumber = text.errors.required;
        } else if (!validatePhoneNumber(paymentData.phoneNumber)) {
          newErrors.phoneNumber = text.errors.invalidPhone;
        }
      } else if (method?.type === 'bank') {
        if (!paymentData.bankAccount) {
          newErrors.bankAccount = text.errors.required;
        }
      }
    } else if (currentStep === 2) {
      if (!agreedToTerms) {
        newErrors.terms = text.errors.required;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handlePayment();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentResult = {
        success: true,
        paymentId: `PAY_${Date.now()}`,
        method: selectedPaymentMethod,
        amount: totalAmount,
        currency: bookingData.currency,
        timestamp: new Date().toISOString()
      };
      
      onPaymentComplete(paymentResult);
    } catch (error) {
      setErrors({ payment: text.errors.paymentFailed });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{text.title}</h1>
              <p className="text-sm text-muted-foreground">{text.subtitle}</p>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.isCompleted 
                  ? 'bg-green-500 text-white' 
                  : step.isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step.isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  step.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-1" />
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Payment Method Selection */}
          {currentStep === 0 && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4">{steps[0].title}</h2>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{method.icon}</div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{method.name}</h3>
                              {method.isPopular && (
                                <Badge variant="secondary" className="text-xs">
                                  Populaire
                                </Badge>
                              )}
                              {method.isMobileOptimized && (
                                <Badge variant="outline" className="text-xs">
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  Mobile
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {method.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-green-600 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {method.processingTime}
                              </span>
                              {method.fees === 0 && (
                                <span className="text-xs text-blue-600">
                                  Sans frais
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedPaymentMethod === method.id
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === method.id && (
                            <CheckCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {errors.paymentMethod && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.paymentMethod}
                </p>
              )}
            </motion.div>
          )}

          {/* Step 2: Payment Details */}
          {currentStep === 1 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4">{steps[1].title}</h2>
              
              {selectedPaymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{text.fields.cardNumber}</Label>
                    <Input
                      id="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        cardNumber: formatCardNumber(e.target.value)
                      })}
                      placeholder={text.placeholders.cardNumber}
                      className={errors.cardNumber ? 'border-red-500' : ''}
                      maxLength={19}
                    />
                    {errors.cardNumber && (
                      <p className="text-sm text-red-500">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">{text.fields.expiryDate}</Label>
                      <Input
                        id="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData({
                          ...paymentData,
                          expiryDate: formatExpiryDate(e.target.value)
                        })}
                        placeholder={text.placeholders.expiryDate}
                        className={errors.expiryDate ? 'border-red-500' : ''}
                        maxLength={5}
                      />
                      {errors.expiryDate && (
                        <p className="text-sm text-red-500">{errors.expiryDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">{text.fields.cvv}</Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData({
                          ...paymentData,
                          cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                        })}
                        placeholder={text.placeholders.cvv}
                        className={errors.cvv ? 'border-red-500' : ''}
                        maxLength={4}
                      />
                      {errors.cvv && (
                        <p className="text-sm text-red-500">{errors.cvv}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">{text.fields.cardholderName}</Label>
                    <Input
                      id="cardholderName"
                      value={paymentData.cardholderName}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        cardholderName: e.target.value
                      })}
                      placeholder={text.placeholders.cardholderName}
                      className={errors.cardholderName ? 'border-red-500' : ''}
                    />
                    {errors.cardholderName && (
                      <p className="text-sm text-red-500">{errors.cardholderName}</p>
                    )}
                  </div>
                </div>
              )}

              {(selectedPaymentMethod === 'mobile' || selectedPaymentMethod === 'wallet') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">{text.fields.phoneNumber}</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={paymentData.phoneNumber}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        phoneNumber: e.target.value
                      })}
                      placeholder={text.placeholders.phoneNumber}
                      className={errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">{text.fields.bankAccount}</Label>
                    <Input
                      id="bankAccount"
                      value={paymentData.bankAccount}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        bankAccount: e.target.value
                      })}
                      placeholder={text.placeholders.bankAccount}
                      className={errors.bankAccount ? 'border-red-500' : ''}
                    />
                    {errors.bankAccount && (
                      <p className="text-sm text-red-500">{errors.bankAccount}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Security indicators */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      {text.security.title}
                    </h4>
                  </div>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3 h-3" />
                      <span>{text.security.ssl}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3 h-3" />
                      <span>{text.security.encryption}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3" />
                      <span>{text.security.pci}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 2 && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4">{steps[2].title}</h2>
              
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{text.summary.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{text.summary.loft}:</span>
                    <span className="font-medium">{bookingData.loftName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{text.summary.dates}:</span>
                    <span className="font-medium">
                      {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{text.summary.guests}:</span>
                    <span className="font-medium">{bookingData.guests}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{text.summary.subtotal}:</span>
                    <span>{bookingData.totalPrice} {bookingData.currency}</span>
                  </div>
                  {serviceFees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{text.summary.fees}:</span>
                      <span>{serviceFees} {bookingData.currency}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{text.summary.total}:</span>
                    <span>{totalAmount} {bookingData.currency}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className={errors.terms ? 'border-red-500' : ''}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  {text.terms}
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.terms}
                </p>
              )}

              {errors.payment && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.payment}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex space-x-3 pt-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isProcessing}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {text.actions.back}
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {text.actions.processing}
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {text.actions.pay} {totalAmount} {bookingData.currency}
              </>
            ) : (
              <>
                {text.actions.continue}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}