import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await requireAuthAPI();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    if (!['admin', 'manager', 'employee', 'member'].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { photoId } = await params;
    const supabase = await createClient(true);

    // Get the photo to find its loft_id
    const { data: photo } = await supabase
      .from("loft_photos")
      .select("loft_id")
      .eq("id", photoId)
      .single();

    if (!photo) return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });

    // Remove cover from all photos of this loft
    await supabase
      .from("loft_photos")
      .update({ is_cover: false })
      .eq("loft_id", photo.loft_id);

    // Set this photo as cover
    const { error } = await supabase
      .from("loft_photos")
      .update({ is_cover: true })
      .eq("id", photoId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
