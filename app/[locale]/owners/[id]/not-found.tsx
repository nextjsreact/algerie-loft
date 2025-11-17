import { getTranslations } from 'next-intl/server'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getLocale } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('owners')
  const locale = await getLocale()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">{t('notFoundTitle')}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {t('notFoundDescription')}
      </p>
      <Button asChild>
        <Link href={`/${locale}/owners`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToOwners')}
        </Link>
      </Button>
    </div>
  )
}
