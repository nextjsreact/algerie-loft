"use client"

import { useTranslations } from "next-intl"
import { EditLoftPageClient } from "@/app/[locale]/lofts/[id]/edit/edit-loft-page-client"

interface EditLoftWrapperProps {
  loft: any
  owners: any[]
  zoneAreas: any[]
  internetConnectionTypes: any[]
}

export function EditLoftWrapper({ 
  loft, 
  owners, 
  zoneAreas, 
  internetConnectionTypes 
}: EditLoftWrapperProps) {
  const tLofts = useTranslations('lofts');
  const tCommon = useTranslations('common');

  const translations = {
    editLoft: tLofts('editLoft'),
    updatePropertyDetails: tLofts('updatePropertyDetails'),
    loftUpdated: tLofts('loftUpdated'),
    error: tCommon('error'),
  };

  return (
    <EditLoftPageClient
      loft={loft}
      owners={owners}
      zoneAreas={zoneAreas}
      internetConnectionTypes={internetConnectionTypes}
      translations={translations}
    />
  )
}