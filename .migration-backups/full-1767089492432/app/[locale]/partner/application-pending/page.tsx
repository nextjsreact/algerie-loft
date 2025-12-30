'use client'

import { Clock, CheckCircle, Mail, Phone, LogOut, Home } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use } from 'react'

export default function ApplicationPendingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <Card className="border-t-4 border-t-amber-500 shadow-lg">
          <CardHeader className="text-center pb-10 pt-8">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 mb-4">
              Demande en cours de traitement
            </CardTitle>
            <CardDescription className="text-xl mt-3 max-w-2xl mx-auto">
              Votre demande de partenariat a été soumise avec succès
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 px-8 pb-10">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
              <h3 className="font-semibold text-lg text-amber-900 mb-5 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Prochaines étapes
              </h3>
              <ol className="space-y-4 text-base text-amber-800">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Notre équipe examinera votre demande dans les 24-48 heures</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Nous vérifierons les informations fournies</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Vous recevrez un email avec la décision</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">4.</span>
                  <span>Si approuvé, vous pourrez accéder au tableau de bord partenaire</span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
              <h3 className="font-semibold text-lg text-blue-900 mb-4">
                Besoin d'aide ?
              </h3>
              <p className="text-base text-blue-800 mb-5">
                Si vous avez des questions concernant votre demande, n'hésitez pas à nous contacter.
              </p>
              <div className="space-y-3 text-base">
                <div className="flex items-center gap-2 text-blue-700">
                  <Mail className="h-4 w-4" />
                  <span>partners@loft-algerie.com</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <Phone className="h-4 w-4" />
                  <span>+213 XXX XXX XXX</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Link href={`/${locale}`} className="flex-1">
                <Button variant="outline" className="w-full h-12 text-base">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex-1 w-full h-12 text-base border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
