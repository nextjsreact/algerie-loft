"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"

export function ExecutiveRedirectNotice() {
  const locale = useLocale()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès Executive
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            En tant qu'Executive, vous avez accès à un dashboard spécialisé avec une vue stratégique de l'entreprise.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Vous allez être redirigé vers votre dashboard Executive...
            </p>
          </div>
          
          <Link href={`/${locale}/executive`}>
            <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              Accéder au Dashboard Executive
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          <p className="text-xs text-gray-500">
            Si la redirection ne fonctionne pas, cliquez sur le bouton ci-dessus.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}