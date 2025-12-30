import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Use requireAuthAPI to avoid redirects in API routes
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as File;
    const loftId = formData.get("loftId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Générer un nom de fichier unique
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = loftId
      ? `lofts/${loftId}/${fileName}`
      : `temp/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("loft-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from("loft-photos")
      .getPublicUrl(filePath);

    // Sauvegarder les métadonnées en base si loftId fourni
    let photoRecord: { id: string } | null = null;
    if (loftId) {
      const { data: insertData, error: insertError } = await supabase
        .from("loft_photos")
        .insert({
          loft_id: loftId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          url: urlData.publicUrl,
          uploaded_by: session.user.id,
        })
        .select()
        .single();

      if (insertError) {
        // Supprimer le fichier uploadé en cas d'erreur
        await supabase.storage.from("loft-photos").remove([filePath]);
        return NextResponse.json(
          { error: "Erreur lors de la sauvegarde" },
          { status: 500 }
        );
      }

      photoRecord = insertData;
    }

    return NextResponse.json({
      id: photoRecord?.id,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      path: filePath,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
