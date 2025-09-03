"use client"

import { useTranslations } from "next-intl"
import ZoneAreasClientWrapper from "@/components/settings/zone-areas-client-wrapper"
import type { ZoneArea } from "@/app/actions/zone-areas"

interface ZoneAreasWrapperProps {
  initialZoneAreas: ZoneArea[]
}

export function ZoneAreasWrapper({ initialZoneAreas }: ZoneAreasWrapperProps) {
  const t = useTranslations("zoneAreas");

  const translations = {
    pageTitle: t('nav.zoneAreas'),
    subtitle: t('zoneAreas.subtitle'),
    addNew: t('settings.zoneAreas.addNew'),
    updateZoneArea: t('zoneAreas.updateZoneArea'),
    createZoneArea: t('zoneAreas.createZoneArea'),
    updateZoneAreaInfo: t('settings.zoneAreas.updateZoneAreaInfo'),
    createNewZoneArea: t('settings.zoneAreas.createNewZoneArea'),
    existingZoneAreas: t('settings.zoneAreas.existingZoneAreas'),
    totalZoneAreas: t('settings.zoneAreas.totalZoneAreas', { count: initialZoneAreas?.length || 0 }),
    noZoneAreasFound: t('settings.zoneAreas.noZoneAreasFound'),
    addFirstZoneArea: t('settings.zoneAreas.addFirstZoneArea'),
    success: t('common.success'),
    error: t('common.error'),
    updateSuccess: t('zoneAreas.updateSuccess'),
    createSuccess: t('zoneAreas.createSuccess'),
    refreshError: t('settings.zoneAreas.refreshError'),
    // Nouvelles traductions pour le formulaire
    name: t('zoneAreas.name'),
    namePlaceholder: t('zoneAreas.namePlaceholder') || "Enter zone area name",
    saving: t('common.saving') || "Saving...",
    update: t('common.update') || "Update", 
    create: t('common.create') || "Create",
    cancel: t('common.cancel') || "Cancel",
  };

  return (
    <ZoneAreasClientWrapper
      initialZoneAreas={initialZoneAreas}
      translations={translations}
    />
  )
}