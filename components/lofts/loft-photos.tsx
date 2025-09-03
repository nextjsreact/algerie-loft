"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload";
import { useTranslations } from "next-intl";
import { useLoftPhotos } from "@/hooks/use-loft-photos";
import { Loader2 } from "lucide-react";

interface LoftPhoto {
  id: string;
  url: string;
  name: string;
  size: number;
  isUploading?: boolean;
}

interface LoftPhotosProps {
  loftId: string;
}

export function LoftPhotos({ loftId }: LoftPhotosProps) {
  const t = useTranslations("lofts");
  const { photos, loading, refreshPhotos } = useLoftPhotos(loftId);

  const handlePhotosChange = () => {
    // Rafraîchir les photos après un changement
    refreshPhotos();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("photos.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement des photos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convertir les photos du hook au format attendu par PhotoUpload
  const formattedPhotos: LoftPhoto[] = photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    name: photo.name,
    size: photo.size,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("photos.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("photos.description")}
        </p>
      </CardHeader>
      <CardContent>
        <PhotoUpload
          loftId={loftId}
          existingPhotos={formattedPhotos}
          onPhotosChange={handlePhotosChange}
          maxPhotos={10}
        />
      </CardContent>
    </Card>
  );
}