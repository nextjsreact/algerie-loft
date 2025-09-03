"use client"

import { useTranslations } from 'next-intl';
import { EditLoftFormWrapper } from "./edit-loft-form-wrapper"

interface EditLoftPageClientProps {
  loft: any
  owners: any[]
  zoneAreas: any[]
  internetConnectionTypes: any[]
}

export function EditLoftPageClient({ loft, owners, zoneAreas, internetConnectionTypes }: EditLoftPageClientProps) {
  const t = useTranslations('lofts');

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold">{t('editLoft')}</h1>
        <p className="text-muted-foreground mt-2">{t('updatePropertyDetails')}</p>
      </div>
      <EditLoftFormWrapper 
        loft={loft}
        owners={owners} 
        zoneAreas={zoneAreas} 
        internetConnectionTypes={internetConnectionTypes} 
      />
    </div>
  )
}