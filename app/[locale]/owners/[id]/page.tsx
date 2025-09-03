import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { format } from "date-fns"
import { DeleteOwnerButton } from './delete-button'
import { getTranslations } from 'next-intl/server'

export default async function OwnerViewPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params;
  const t = await getTranslations('owners');
  const tCommon = await getTranslations('common');
  
  const supabase = await createClient()
  const { data: owner, error } = await supabase
    .from("loft_owners")
    .select("*")
    .eq("id", id)
    .single()

  if (!owner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('notFoundTitle')}</h1>
          <p className="text-muted-foreground">{t('notFoundDescription', { id })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{owner.name}</h1>
          <p className="text-muted-foreground">{t('ownerDetails')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('ownerInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t('ownershipType')}</h3>
            <p>{owner.ownership_type === "company" ? t('companyOwned') : t('thirdParty')}</p>
          </div>
          
          {owner.email && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t('email')}</h3>
              <p>{owner.email}</p>
            </div>
          )}

          {owner.phone && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t('phone')}</h3>
              <p>{owner.phone}</p>
            </div>
          )}

          {owner.address && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t('address')}</h3>
              <p>{owner.address}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <DeleteOwnerButton id={owner.id} />
            <Button variant="outline" asChild>
              <Link href={`/${locale}/owners/${owner.id}/edit`}>{tCommon('edit')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
