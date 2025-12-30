import Link from 'next/link'
import { Building2, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LoginLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { locale } = await params
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Loft Algérie</span>
          </Link>

          <Link href={`/${locale}`}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Home className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
