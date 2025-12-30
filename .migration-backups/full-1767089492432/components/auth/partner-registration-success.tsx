'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Clock, Mail, FileText, ArrowRight } from 'lucide-react'

interface PartnerRegistrationSuccessProps {
  locale: string
}

export function PartnerRegistrationSuccess({ locale }: PartnerRegistrationSuccessProps) {
  const router = useRouter()

  const nextSteps = [
    {
      icon: Mail,
      title: 'Vérification email',
      description: 'Vérifiez votre boîte mail et cliquez sur le lien de confirmation'
    },
    {
      icon: FileText,
      title: 'Vérification des documents',
      description: 'Notre équipe vérifiera vos informations professionnelles'
    },
    {
      icon: CheckCircle,
      title: 'Activation du compte',
      description: 'Vous recevrez un email de confirmation une fois votre compte approuvé'
    }
  ]

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">
            Inscription réussie !
          </CardTitle>
          <CardDescription className="text-lg">
            Votre demande de compte partenaire a été soumise avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription>
              <strong>Compte en attente de vérification</strong><br />
              Votre compte sera activé après vérification de vos informations par notre équipe. 
              Ce processus prend généralement 24 à 48 heures.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Prochaines étapes :</h3>
            
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pendant l'attente</h4>
            <p className="text-sm text-blue-800">
              Vous pouvez déjà préparer vos photos de lofts et réfléchir à vos tarifs. 
              Une fois votre compte approuvé, vous pourrez immédiatement commencer à ajouter vos propriétés.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/login`)}
              className="flex-1"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => router.push(`/${locale}/public`)}
              className="flex-1"
            >
              Retour à l'accueil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Des questions ? Contactez-nous à{' '}
              <a href="mailto:support@loftalgerie.com" className="text-blue-600 hover:underline">
                support@loftalgerie.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}