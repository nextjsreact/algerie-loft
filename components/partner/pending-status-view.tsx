'use client'

import { Clock, Mail, Phone, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PendingStatusViewProps {
  locale: string
  userName?: string
  submittedDate?: string
}

export function PendingStatusView({ locale, userName, submittedDate }: PendingStatusViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="border-t-4 border-t-amber-500 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {userName ? `Bienvenue ${userName}!` : 'Bienvenue!'}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Votre demande de partenariat est en cours de traitement
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {submittedDate && (
              <div className="text-center text-sm text-gray-600">
                Demande soumise le {new Date(submittedDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Statut de votre demande
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Demande reçue</p>
                    <p className="text-sm text-gray-600">Votre formulaire a été soumis avec succès</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">En cours d'examen</p>
                    <p className="text-sm text-gray-600">Notre équipe vérifie vos informations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Décision finale</p>
                    <p className="text-sm text-gray-500">Vous recevrez un email avec notre décision</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Que se passe-t-il ensuite ?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Notre équipe examine votre demande sous 24-48 heures</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Nous vérifions les informations fournies</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Vous recevrez un email avec la décision</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Si approuvé, vous aurez accès au tableau de bord complet</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Besoin d'aide ?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Si vous avez des questions concernant votre demande, contactez-nous:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:partners@loft-algerie.com" className="hover:text-blue-600">
                    partners@loft-algerie.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>+213 XXX XXX XXX</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link href={`/${locale}`}>
                <Button variant="outline" className="w-full">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
