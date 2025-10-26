"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Cookie, 
  Settings, 
  Shield, 
  BarChart3, 
  Target, 
  Palette,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { COOKIE_CATEGORIES, type CookieConsentData } from '@/lib/schemas/privacy'
import { PrivacyService } from '@/lib/services/privacy-service'

interface CookieConsentBannerProps {
  userId?: string
  sessionId?: string
  onConsentChange?: (consent: CookieConsentData) => void
  className?: string
}

export function CookieConsentBanner({ 
  userId, 
  sessionId, 
  onConsentChange, 
  className 
}: CookieConsentBannerProps) {
  const t = useTranslations('privacy.cookies')
  
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<CookieConsentData>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    functional: false,
    timestamp: new Date().toISOString(),
    version: '1.0'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkExistingConsent()
  }, [userId, sessionId])

  const checkExistingConsent = async () => {
    try {
      const existingConsent = await PrivacyService.getCookieConsent(userId || null, sessionId)
      
      if (!existingConsent) {
        // Show banner if no consent recorded
        setIsVisible(true)
      } else {
        // Use existing consent
        const consentData = existingConsent.consent_data as CookieConsentData
        setConsent(consentData)
        onConsentChange?.(consentData)
      }
    } catch (error) {
      console.error('Failed to check existing consent:', error)
      setIsVisible(true) // Show banner on error
    }
  }

  const handleConsentChange = (category: keyof CookieConsentData, value: boolean) => {
    if (category === 'necessary') return // Cannot disable necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [category]: value
    }))
  }

  const handleAcceptAll = async () => {
    const fullConsent: CookieConsentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    await saveConsent(fullConsent)
  }

  const handleAcceptSelected = async () => {
    const selectedConsent: CookieConsentData = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    await saveConsent(selectedConsent)
  }

  const handleRejectAll = async () => {
    const minimalConsent: CookieConsentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    await saveConsent(minimalConsent)
  }

  const saveConsent = async (consentData: CookieConsentData) => {
    setIsLoading(true)
    
    try {
      await PrivacyService.recordCookieConsent(
        userId || null,
        consentData,
        undefined, // IP will be captured server-side
        navigator.userAgent
      )
      
      setConsent(consentData)
      setIsVisible(false)
      onConsentChange?.(consentData)
      
      // Store in localStorage for immediate use
      localStorage.setItem('cookie-consent', JSON.stringify(consentData))
      
    } catch (error) {
      console.error('Failed to save consent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'necessary': return <Shield className="w-4 h-4" />
      case 'analytics': return <BarChart3 className="w-4 h-4" />
      case 'marketing': return <Target className="w-4 h-4" />
      case 'preferences': return <Palette className="w-4 h-4" />
      case 'functional': return <Zap className="w-4 h-4" />
      default: return <Cookie className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'necessary': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'analytics': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'marketing': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'preferences': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'functional': return 'text-teal-600 bg-teal-100 dark:bg-teal-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t shadow-lg",
          className
        )}
      >
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cookie className="w-6 h-6 text-amber-600" />
                <CardTitle className="text-lg">{t('title')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>{t('customize')}</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            <CardDescription className="text-sm">
              {t('description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Cookie Categories */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={cn("p-1 rounded", getCategoryColor(key))}>
                              {getCategoryIcon(key)}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{category.name}</h4>
                              {category.required && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('required')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Checkbox
                            checked={consent[key as keyof CookieConsentData] as boolean}
                            onCheckedChange={(checked) => 
                              handleConsentChange(key as keyof CookieConsentData, checked as boolean)
                            }
                            disabled={category.required}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                        
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t('examples')}: </span>
                          {category.examples.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleAcceptAll}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {t('acceptAll')}
              </Button>
              
              {showDetails && (
                <Button
                  onClick={handleAcceptSelected}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('acceptSelected')}
                </Button>
              )}
              
              <Button
                onClick={handleRejectAll}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {t('rejectAll')}
              </Button>
            </div>

            {/* Privacy Policy Link */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {t('policyText')}{' '}
                <a 
                  href="/privacy-policy" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('privacyPolicy')}
                </a>
                {' '}{t('and')}{' '}
                <a 
                  href="/cookie-policy" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('cookiePolicy')}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}