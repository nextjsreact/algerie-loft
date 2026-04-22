"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle, Star, Trash2, CheckSquare, Square } from "lucide-react";
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
  is_cover?: boolean;
}

export function PhotoUpload({
  loftId,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 15,
}: PhotoUploadProps) {
  const t = useTranslations("lofts");
  const [photos, setPhotos] = useState<LoftPhoto[]>(existingPhotos);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    photoIndex: number | null;
    photoName: string;
    isBulk: boolean;
  }>({ isOpen: false, photoIndex: null, photoName: "", isBulk: false });

  useEffect(() => {
    setPhotos(existingPhotos);
    setSelectedIndexes(new Set());
    setSelectionMode(false);
  }, [existingPhotos]);

  const updatePhotos = useCallback(
    (newPhotos: LoftPhoto[]) => {
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
    },
    [onPhotosChange]
  );

  const uploadPhoto = useCallback(async (file: File): Promise<LoftPhoto> => {
    const formData = new FormData();
    formData.append("file", file);
    if (loftId) formData.append("loftId", loftId);
    const response = await fetch("/api/lofts/photos/upload", { method: "POST", body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur HTTP ${response.status}`);
    }
    const result = await response.json();
    if (!result.url || !result.name) throw new Error("Réponse serveur incomplète");
    return result;
  }, [loftId]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const isImage = file.type.startsWith("image/") || ['heic','heif'].includes(ext)
      if (!isImage) { toast.error(`${file.name} : format non supporté`); return false; }
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} : fichier trop volumineux (max 20MB)`); return false; }
      return true;
    });
    if (photos.length + validFiles.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos`); return;
    }
    const uploadingPhotos: LoftPhoto[] = validFiles.map((file) => ({
      url: URL.createObjectURL(file), name: file.name, size: file.size, isUploading: true,
    }));
    const newPhotos = [...photos, ...uploadingPhotos];
    updatePhotos(newPhotos);
    for (let i = 0; i < validFiles.length; i++) {
      const photoIndex = photos.length + i;
      try {
        const uploaded = await uploadPhoto(validFiles[i]);
        const updated = [...newPhotos];
        updated[photoIndex] = uploaded;
        updatePhotos(updated);
        toast.success(`${validFiles[i].name} uploadée`);
      } catch (error) {
        toast.error(`Erreur : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        const updated = newPhotos.filter((_, idx) => idx !== photoIndex);
        updatePhotos(updated);
      }
    }
  }, [photos, maxPhotos, updatePhotos, uploadPhoto]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Toggle selection of a single photo
  const toggleSelect = (index: number) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectAll = () => {
    const uploadedIndexes = photos.map((_, i) => i).filter(i => !photos[i].isUploading);
    setSelectedIndexes(new Set(uploadedIndexes));
  };

  const deselectAll = () => setSelectedIndexes(new Set());

  const setCoverPhoto = async (index: number, event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    const photo = photos[index];
    if (!photo.id || !loftId) return;
    try {
      const response = await fetch(`/api/lofts/photos/${photo.id}/cover`, { method: 'POST' });
      if (!response.ok) throw new Error();
      updatePhotos(photos.map((p, i) => ({ ...p, is_cover: i === index })));
      toast.success('Photo principale définie');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  // Open delete dialog — single or bulk
  const openDeleteSingle = (index: number, e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    setDeleteConfirmation({ isOpen: true, photoIndex: index, photoName: photos[index].name, isBulk: false });
  };

  const openDeleteBulk = () => {
    setDeleteConfirmation({ isOpen: true, photoIndex: null, photoName: '', isBulk: true });
  };

  const closeDeleteConfirmation = () =>
    setDeleteConfirmation({ isOpen: false, photoIndex: null, photoName: '', isBulk: false });

  const deletePhoto = async (photo: LoftPhoto) => {
    if (photo.id && loftId) {
      const response = await fetch(`/api/lofts/photos/${photo.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
    }
  };

  const confirmDelete = async () => {
    const { photoIndex, isBulk } = deleteConfirmation;
    if (isBulk) {
      // Bulk delete
      const toDelete = Array.from(selectedIndexes).map(i => photos[i]);
      let successCount = 0;
      let errorCount = 0;
      for (const photo of toDelete) {
        try { await deletePhoto(photo); successCount++; }
        catch { errorCount++; }
      }
      const remaining = photos.filter((_, i) => !selectedIndexes.has(i));
      updatePhotos(remaining);
      setSelectedIndexes(new Set());
      setSelectionMode(false);
      if (successCount > 0) toast.success(`${successCount} photo(s) supprimée(s)`);
      if (errorCount > 0) toast.error(`${errorCount} photo(s) non supprimée(s)`);
    } else {
      // Single delete
      if (photoIndex === null) return;
      try {
        await deletePhoto(photos[photoIndex]);
        updatePhotos(photos.filter((_, i) => i !== photoIndex));
        // Adjust selected indexes
        setSelectedIndexes(prev => {
          const next = new Set<number>();
          prev.forEach(i => { if (i < photoIndex) next.add(i); else if (i > photoIndex) next.add(i - 1); });
          return next;
        });
        toast.success("Photo supprimée");
      } catch { toast.error("Erreur lors de la suppression"); }
    }
    closeDeleteConfirmation();
  };

  const uploadedCount = photos.filter(p => !p.isUploading).length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium mb-2">{t("photos.dragDropText")}</h3>
            <p className="text-sm text-muted-foreground mb-1">{t("photos.supportedFormats")}</p>
            <p className="text-xs text-muted-foreground">{t("photos.photoCount", { count: photos.length, max: maxPhotos })}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => {
            const input = document.createElement("input");
            input.type = "file"; input.multiple = true; input.accept = "image/*";
            input.onchange = (e) => { const files = (e.target as HTMLInputElement).files; if (files) handleFileSelect(files); };
            input.click();
          }}>
            <ImageIcon className="h-4 w-4 mr-2" />{t("photos.selectPhotos")}
          </Button>
        </div>
      </div>

      {/* Toolbar — selection controls */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button" size="sm" variant={selectionMode ? "default" : "outline"}
              onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) deselectAll(); }}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {selectionMode ? "Annuler sélection" : "Sélectionner"}
            </Button>
            {selectionMode && (
              <>
                <Button type="button" size="sm" variant="outline" onClick={selectAll}>
                  Tout sélectionner ({uploadedCount})
                </Button>
                {selectedIndexes.size > 0 && (
                  <Button type="button" size="sm" variant="outline" onClick={deselectAll}>
                    Désélectionner
                  </Button>
                )}
              </>
            )}
          </div>
          {selectionMode && selectedIndexes.size > 0 && (
            <Button type="button" size="sm" variant="destructive" onClick={openDeleteBulk}>
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer {selectedIndexes.size} photo{selectedIndexes.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const isSelected = selectedIndexes.has(index);
            return (
              <Card
                key={index}
                className={`relative group overflow-hidden cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                onClick={() => { if (selectionMode && !photo.isUploading) toggleSelect(index); }}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <Image
                      src={photo.url} alt={photo.name} fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />

                    {/* Selection checkbox overlay */}
                    {selectionMode && !photo.isUploading && (
                      <div className="absolute top-2 left-2 z-20">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shadow ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/80 border-gray-400'
                        }`}>
                          {isSelected && <X className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    )}

                    {/* Hover actions (only when not in selection mode) */}
                    {!selectionMode && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {photo.isUploading ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <>
                            <Button size="sm" variant={photo.is_cover ? "default" : "outline"}
                              onClick={(e) => setCoverPhoto(index, e)}
                              className="h-8 w-8 p-0" title="Définir comme photo principale">
                              <Star className={`h-4 w-4 ${photo.is_cover ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={(e) => openDeleteSingle(index, e)}
                              className="h-8 w-8 p-0" title="Supprimer">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Cover badge */}
                    {photo.is_cover && (
                      <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-900" /> Principal
                      </div>
                    )}

                    {/* Upload indicator */}
                    {photo.isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {deleteConfirmation.isBulk
                ? `Supprimer ${selectedIndexes.size} photo${selectedIndexes.size > 1 ? 's' : ''}`
                : "Confirmer la suppression"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirmation.isBulk
                ? `Vous allez supprimer définitivement ${selectedIndexes.size} photo${selectedIndexes.size > 1 ? 's' : ''}. Cette action est irréversible.`
                : `Supprimer "${deleteConfirmation.photoName}" ? Cette action est irréversible.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={closeDeleteConfirmation} className="mt-2 sm:mt-0">
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteConfirmation.isBulk ? `Supprimer ${selectedIndexes.size} photo${selectedIndexes.size > 1 ? 's' : ''}` : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
