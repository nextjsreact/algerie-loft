import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await requireAuthAPI();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admin, manager, employee can delete photos
    if (!['admin', 'manager', 'employee', 'member'].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { photoId } = await params;
    if (!photoId) {
      return NextResponse.json({ error: "ID de photo requis" }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = await createClient(true);

    // Get photo info
    const { data: photo, error: fetchError } = await supabase
      .from("loft_photos")
      .select("*")
      .eq("id", photoId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
    }

    // Delete from storage
    if (photo.file_path) {
      await supabase.storage
        .from("loft-photos")
        .remove([photo.file_path]);
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from("loft_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE photo]', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
