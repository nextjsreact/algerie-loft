import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

// Disable static generation for this page since it uses client-side translations
export const dynamic = 'force-dynamic';

export default function UnauthorizedPage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{t('unauthorized.accessDenied')}</CardTitle>
          <CardDescription>
            {t('unauthorized.noPermission')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('unauthorized.backToDashboard')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}