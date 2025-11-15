import { Clock, CheckCircle, Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ApplicationPendingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-t-4 border-t-amber-500 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Demande en cours de traitement
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Votre demande de partenariat a été soumise avec succès
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Prochaines étapes
              </h3>
              <ol className="space-y-3 text-sm text-amber-800">
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Besoin d'aide ?
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Si vous avez des questions concernant votre demande, n'hésitez pas à nous contacter.
              </p>
              <div className="space-y-2 text-sm">
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

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link href={`/${locale}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Retour à l'accueil
                </Button>
              </Link>
              <Link href={`/${locale}/partner/login`} className="flex-1">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Se connecter
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
