import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface LoftPhoto {
  id: string;
  url: string;
  name: string;
  size: number;
  created_at: string;
  uploaded_by: string;
}

export function useLoftPhotos(loftId: string) {
  const [photos, setPhotos] = useState<LoftPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const loadPhotos = async () => {
    if (!loftId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("loft_photos")
        .select(`
          id,
          file_name,
          file_size,
          url,
          created_at,
          uploaded_by
        `)
        .eq("loft_id", loftId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const formattedPhotos: LoftPhoto[] = (data || []).map((photo) => ({
        id: photo.id,
        url: photo.url,
        name: photo.file_name,
        size: photo.file_size,
        created_at: photo.created_at,
        uploaded_by: photo.uploaded_by,
      }));

      setPhotos(formattedPhotos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      toast.error("Erreur lors du chargement des photos");
      console.error("Erreur lors du chargement des photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/lofts/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Recharger les photos après suppression
      await loadPhotos();
      toast.success("Photo supprimée avec succès");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
      throw err;
    }
  };

  const refreshPhotos = () => {
    loadPhotos();
  };

  useEffect(() => {
    loadPhotos();
  }, [loftId]);

  return {
    photos,
    loading,
    error,
    deletePhoto,
    refreshPhotos,
  };
}