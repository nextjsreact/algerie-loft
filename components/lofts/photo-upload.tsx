"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";

interface PhotoUploadProps {
  loftId?: string;
  existingPhotos?: LoftPhoto[];
  onPhotosChange?: (photos: LoftPhoto[]) => void;
  maxPhotos?: number;
}

interface LoftPhoto {
  id?: string;
  url: string;
  name: string;
  size: number;
  isUploading?: boolean;
}

export function PhotoUpload({
  loftId,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploadProps) {
  const t = useTranslations("lofts");
  const [photos, setPhotos] = useState<LoftPhoto[]>(existingPhotos);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    photoIndex: number | null;
    photoName: string;
  }>({
    isOpen: false,
    photoIndex: null,
    photoName: "",
  });

  // Sync photos state when existingPhotos prop changes
  useEffect(() => {
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const updatePhotos = useCallback(
    (newPhotos: LoftPhoto[]) => {
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
    },
    [onPhotosChange]
  );

  const uploadPhoto = useCallback(
    async (file: File): Promise<LoftPhoto> => {
      const formData = new FormData();
      formData.append("file", file);
      if (loftId) {
        formData.append("loftId", loftId);
      }

      try {
        const response = await fetch("/api/lofts/photos/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `Erreur HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Si on ne peut pas parser le JSON d'erreur, on garde le message par défaut
          }
          throw new Error(errorMessage);
        }

        let result: {
          id?: string;
          url: string;
          name: string;
          size: number;
          path: string;
        };
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error("Réponse serveur invalide");
        }
        
        // Vérifier que la réponse contient les champs requis
        if (!result.url || !result.name) {
          throw new Error("Réponse serveur incomplète");
        }
        
        return result;
      } catch (error) {
        // Si c'est une erreur réseau ou de fetch
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error("Erreur de connexion réseau");
        }
        
        if (error instanceof Error) {
          throw error;
        }
        
        throw new Error("Erreur inconnue lors de l'upload");
      }
    },
    [loftId]
  );

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(t("photos.invalidFileType", { filename: file.name }));
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB max
          toast.error(t("photos.fileTooLarge", { filename: file.name }));
          return false;
        }
        return true;
      });

      if (photos.length + validFiles.length > maxPhotos) {
        toast.error(t("photos.maxPhotosReached", { max: maxPhotos }));
        return;
      }

      // Ajouter les photos en mode "uploading"
      const uploadingPhotos: LoftPhoto[] = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        isUploading: true,
      }));

      const newPhotos = [...photos, ...uploadingPhotos];
      updatePhotos(newPhotos);

      // Upload chaque fichier
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const photoIndex = photos.length + i;

        try {
          const uploadedPhoto = await uploadPhoto(file);

          // Remplacer la photo "uploading" par la photo uploadée
          const updatedPhotos = [...newPhotos];
          updatedPhotos[photoIndex] = uploadedPhoto;
          updatePhotos(updatedPhotos);

          toast.success(
            t("photos.uploadSuccess", { filename: file.name }) ||
              `Photo ${file.name} uploadée avec succès`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue";
          toast.error(
            t("photos.uploadError", {
              filename: file.name,
              error: errorMessage,
            }) || `Erreur lors de l'upload de ${file.name}: ${errorMessage}`
          );

          // Supprimer la photo en erreur
          const updatedPhotos = newPhotos.filter(
            (_, index) => index !== photoIndex
          );
          updatePhotos(updatedPhotos);
        }
      }
    },
    [photos, maxPhotos, t, updatePhotos, uploadPhoto]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const openDeleteConfirmation = (index: number, event?: React.MouseEvent) => {
    // Empêcher la propagation de l'événement pour éviter la redirection
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const photo = photos[index];
    setDeleteConfirmation({
      isOpen: true,
      photoIndex: index,
      photoName: photo.name,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      photoIndex: null,
      photoName: "",
    });
  };

  const confirmDeletePhoto = async () => {
    const { photoIndex } = deleteConfirmation;
    
    if (photoIndex === null) return;

    const photo = photos[photoIndex];

    if (photo.id && loftId) {
      try {
        const response = await fetch(`/api/lofts/photos/${photo.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression");
        }

        toast.success(t("photos.deleteSuccess") || "Photo supprimée avec succès");
      } catch (error) {
        toast.error(t("photos.deleteError") || "Erreur lors de la suppression");
        closeDeleteConfirmation();
        return;
      }
    }

    const newPhotos = photos.filter((_, i) => i !== photoIndex);
    updatePhotos(newPhotos);
    closeDeleteConfirmation();
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-medium mb-2">{t("photos.dragDropText")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("photos.supportedFormats")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("photos.photoCount", { count: photos.length, max: maxPhotos })}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = "image/*";
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleFileSelect(files);
              };
              input.click();
            }}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {t("photos.selectPhotos")}
          </Button>
        </div>
      </div>

      {/* Galerie de photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />

                  {/* Overlay avec actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {photo.isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => openDeleteConfirmation(index, e)}
                        className="h-8 w-8 p-0"
                        title={t("photos.deletePhoto") || "Supprimer la photo"}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Indicateur d'upload */}
                  {photo.isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/20 p-2">
                      <div className="text-xs text-white text-center">
                        {t("photos.uploading")}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("photos.confirmDelete") || "Confirmer la suppression"}
            </DialogTitle>
            <DialogDescription className="text-left">
              {t("photos.confirmDeleteDescription") || 
                "Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {deleteConfirmation.photoName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("photos.willBeDeleted") || "Cette photo sera définitivement supprimée"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={closeDeleteConfirmation}
              className="mt-2 sm:mt-0"
            >
              {t("photos.cancel") || "Annuler"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePhoto}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              {t("photos.deletePhoto") || "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
