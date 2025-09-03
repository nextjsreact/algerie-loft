"use client"

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { deleteZoneArea, ZoneArea } from "@/app/actions/zone-areas";
import { toast } from "@/components/ui/use-toast";
import { ResponsiveDataDisplay } from "@/components/ui/responsive-table";

interface ZoneAreaListProps {
  zoneAreas: ZoneArea[];
  onEdit: (zoneArea: ZoneArea) => void;
  onRefresh: () => void; // Add onRefresh prop
}

export function ZoneAreaList({ zoneAreas, onEdit, onRefresh }: ZoneAreaListProps) {
  const t = useTranslations('zoneAreas.zoneAreas'); // Utiliser le bon chemin vers les traductions
  const tCommon = useTranslations('zoneAreas.common'); // Pour les messages communs
  
  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteZoneArea(id);
        toast({
          title: tCommon('success'),
          description: t('deleteSuccess'),
        });
        onRefresh();
      } catch (error) {
        toast({
          title: tCommon('error'),
          description: t('deleteError'),
          variant: "destructive",
        });
      }
    }
  };

  const columns = [
    {
      key: 'name',
      label: t('name') || "Name", // Fallback en cas d'erreur
      render: (zoneArea: ZoneArea) => (
        <span className="font-medium">{zoneArea.name}</span>
      )
    }
  ];

  const renderActions = (zoneArea: ZoneArea) => (
    <div className="flex gap-2 justify-end">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(zoneArea)}
        className="h-8 w-8"
        title={t('updateZoneArea')}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(zoneArea.id)}
        className="h-8 w-8 text-red-600 hover:text-red-700"
        title={t('deleteConfirm')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">{t('existingZoneAreas')}</h2>
      <ResponsiveDataDisplay
        data={zoneAreas}
        columns={columns}
        actions={renderActions}
        actionsLabel={t('actions')}
        emptyMessage={t('noZoneAreasYet')}
      />
    </div>
  );
}
