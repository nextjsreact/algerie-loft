'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface ClientRegistrationSuccessProps {
  locale: string
}

export function ClientRegistrationSuccess({ locale }: ClientRegistrationSuccessProps) {
  const t = useTranslations('auth')
  const router = useRouter()

  const handleContinueToLogin = () => {
    router.push(`/${locale}/login`)
  }

  const handleGoToSearch = () => {
    router.push(`/${locale}/client/search`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            {t('clientRegistrationSuccess.title')}
          </CardTitle>
          <CardDescription className="text-green-600">
            {t('clientRegistrationSuccess.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{t('clientRegistrationSuccess.emailSent')}</span>
            </div>
            
            <p className="text-sm text-gray-600">
              {t('clientRegistrationSuccess.nextSteps')}
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                {t('clientRegistrationSuccess.whatNext')}
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• {t('clientRegistrationSuccess.step1')}</li>
                <li>• {t('clientRegistrationSuccess.step2')}</li>
                <li>• {t('clientRegistrationSuccess.step3')}</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleContinueToLogin}
              className="w-full"
              size="lg"
            >
              {t('clientRegistrationSuccess.continueToLogin')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleGoToSearch}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {t('clientRegistrationSuccess.browseProperties')}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            {t('clientRegistrationSuccess.supportText')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}