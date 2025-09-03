import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { photoId } = params;

    if (!photoId) {
      return NextResponse.json(
        { error: "ID de photo requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Récupérer les informations de la photo
    const { data: photo, error: fetchError } = await supabase
      .from("loft_photos")
      .select("*")
      .eq("id", photoId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: "Photo non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut supprimer cette photo
    // (soit le propriétaire, soit l'uploader)
    const { data: loft } = await supabase
      .from("lofts")
      .select("user_id")
      .eq("id", photo.loft_id)
      .single();

    if (loft?.user_id !== session.user.id && photo.uploaded_by !== session.user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from("loft-photos")
      .remove([photo.file_path]);

    if (storageError) {
      // On continue même si la suppression du fichier échoue
    }

    // Supprimer l'enregistrement de la base de données
    const { error: deleteError } = await supabase
      .from("loft_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}