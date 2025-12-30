'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight,
  Building2,
  TrendingUp,
  Users,
  X,
  Phone,
  Mail,
  Calendar,
  Download
} from 'lucide-react';

interface SubtleOwnerCTAProps {
  locale: string;
  variant?: 'floating' | 'inline' | 'sticky';
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
  showMetrics?: boolean;
}

/**
 * Subtle but accessible owner CTAs
 * Implements requirements 4.1, 4.5 - maintains guest-first navigation while providing owner access
 */
export default function SubtleOwnerCTA({ 
  locale, 
  variant = 'floating',
  position = 'bottom-right',
  showMetrics = true
}: SubtleOwnerCTAProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      trigger: {
        title: "Propriétaires",
        subtitle: "Maximisez vos revenus",
        badge: "Gratuit"
      },
      
      expanded: {
        title: "Devenez partenaire",
        subtitle: "Confiez-nous votre loft et augmentez vos revenus de +45% en moyenne",
        
        metrics: [
          { label: "Revenus moyens", value: "+45%", icon: TrendingUp },
          { label: "Taux d'occupation", value: "85%", icon: Building2 },
          { label: "Propriétaires satisfaits", value: "150+", icon: Users }
        ],
        
        actions: [
          { 
            label: "Évaluation gratuite", 
            type: "primary" as const,
            icon: Calendar,
            description: "Obtenez une estimation en 24h"
          },
          { 
            label: "Télécharger la brochure", 
            type: "secondary" as const,
            icon: Download,
            description: "Guide complet PDF"
          },
          { 
            label: "Appeler maintenant", 
            type: "outline" as const,
            icon: Phone,
            description: "+213 XX XX XX XX"
          }
        ],
        
        close: "Fermer"
      }
    },
    en: {
      trigger: {
        title: "Property owners",
        subtitle: "Maximize your income",
        badge: "Free"
      },
      
      expanded: {
        title: "Become a partner",
        subtitle: "Entrust us with your loft and increase your revenue by +45% on average",
        
        metrics: [
          { label: "Average revenue", value: "+45%", icon: TrendingUp },
          { label: "Occupancy rate", value: "85%", icon: Building2 },
          { label: "Satisfied owners", value: "150+", icon: Users }
        ],
        
        actions: [
          { 
            label: "Free evaluation", 
            type: "primary" as const,
            icon: Calendar,
            description: "Get an estimate in 24h"
          },
          { 
            label: "Download brochure", 
            type: "secondary" as const,
            icon: Download,
            description: "Complete PDF guide"
          },
          { 
            label: "Call now", 
            type: "outline" as const,
            icon: Phone,
            description: "+213 XX XX XX XX"
          }
        ],
        
        close: "Close"
      }
    },
    ar: {
      trigger: {
        title: "أصحاب العقارات",
        subtitle: "اعظموا دخلكم",
        badge: "مجاني"
      },
      
      expanded: {
        title: "كن شريكاً",
        subtitle: "عهد إلينا بشقتك المفروشة وزد إيراداتك بمعدل +45%",
        
        metrics: [
          { label: "متوسط الإيرادات", value: "+45%", icon: TrendingUp },
          { label: "معدل الإشغال", value: "85%", icon: Building2 },
          { label: "المالكون الراضون", value: "150+", icon: Users }
        ],
        
        actions: [
          { 
            label: "تقييم مجاني", 
            type: "primary" as const,
            icon: Calendar,
            description: "احصل على تقدير خلال 24 ساعة"
          },
          { 
            label: "تحميل الكتيب", 
            type: "secondary" as const,
            icon: Download,
            description: "دليل PDF كامل"
          },
          { 
            label: "اتصل الآن", 
            type: "outline" as const,
            icon: Phone,
            description: "+213 XX XX XX XX"
          }
        ],
        
        close: "إغلاق"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  if (isDismissed) return null;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6'
  };

  // Floating variant (subtle, non-intrusive)
  if (variant === 'floating') {
    return (
      <div className={`fixed ${positionClasses[position]} z-40`}>
        <AnimatePresence>
          {!isExpanded ? (
            // Collapsed state - subtle trigger
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={() => setIsExpanded(true)}
                className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-4 py-3 flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium">{text.trigger.title}</div>
                  <div className="text-xs opacity-90">{text.trigger.subtitle}</div>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 text-xs ml-1">
                  {text.trigger.badge}
                </Badge>
              </Button>
            </motion.div>
          ) : (
            // Expanded state - detailed CTA
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-80 shadow-2xl border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {text.expanded.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {text.expanded.subtitle}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDismissed(true)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Metrics */}
                  {showMetrics && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {text.expanded.metrics.map((metric, index) => {
                        const IconComponent = metric.icon;
                        return (
                          <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <IconComponent className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {metric.value}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {metric.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {text.expanded.actions.map((action, index) => {
                      const IconComponent = action.icon;
                      return (
                        <Button
                          key={index}
                          variant={action.type}
                          size="sm"
                          className={`w-full justify-start ${
                            action.type === 'primary' 
                              ? 'bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700' 
                              : ''
                          }`}
                        >
                          <IconComponent className="h-4 w-4 mr-2" />
                          <div className="text-left flex-1">
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs opacity-75">{action.description}</div>
                          </div>
                          <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="w-full mt-3 text-gray-500 hover:text-gray-700"
                  >
                    {text.expanded.close}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant (for use within sections)
  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-orange-600 rounded-full p-3">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {text.expanded.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {text.expanded.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white"
            >
              {text.expanded.actions[0].label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sticky variant (for persistent visibility)
  if (variant === 'sticky') {
    return (
      <div className="sticky top-20 z-30 mb-6">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-purple-200 dark:border-purple-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                {text.trigger.title}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {text.trigger.subtitle}
              </span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
            >
              {text.expanded.actions[0].label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}