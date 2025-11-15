import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ShieldAlert, UserPlus, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">
            Accès Réservé aux Partenaires
          </CardTitle>
          <CardDescription className="text-base">
            Cette section est réservée aux partenaires de Loft Algérie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Vous souhaitez devenir partenaire ?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Rejoignez notre réseau de partenaires et bénéficiez de :
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Gestion simplifiée de vos propriétés</li>
              <li>• Suivi en temps réel de vos réservations</li>
              <li>• Rapports détaillés de vos revenus</li>
              <li>• Support dédié de notre équipe</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/partner/register" className="flex-1">
              <Button className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Devenir Partenaire
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
