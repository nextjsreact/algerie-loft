import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// HEIC/HEIF mime types (browsers may send these or generic octet-stream)
const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
const HEIC_EXTENSIONS = ['heic', 'heif']

function isHeic(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return HEIC_TYPES.includes(file.type.toLowerCase()) || HEIC_EXTENSIONS.includes(ext)
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const loftId = formData.get("loftId") as string;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Accept images including HEIC (type may come as application/octet-stream from some browsers)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const isImage = file.type.startsWith("image/") || HEIC_EXTENSIONS.includes(ext)
    if (!isImage) {
      return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
    }

    // 20MB max (HEIC files can be large before conversion)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier est trop volumineux (max 20MB)" }, { status: 400 });
    }

    const supabase = await createClient();

    let fileBuffer = Buffer.from(await file.arrayBuffer())
    let finalMimeType = file.type
    let finalExtension = ext
    let finalSize = file.size

    // Convert HEIC/HEIF → JPEG automatically
    if (isHeic(file)) {
      try {
        fileBuffer = await sharp(fileBuffer)
          .jpeg({ quality: 90, progressive: true })
          .toBuffer()
        finalMimeType = 'image/jpeg'
        finalExtension = 'jpg'
        finalSize = fileBuffer.length
        console.log(`[upload] Converted HEIC → JPEG: ${file.name} (${file.size} → ${finalSize} bytes)`)
      } catch (convErr) {
        console.error('[upload] HEIC conversion failed:', convErr)
        return NextResponse.json(
          { error: "Impossible de convertir le fichier HEIC. Veuillez convertir en JPEG ou PNG avant l'upload." },
          { status: 400 }
        )
      }
    } else {
      // For other formats, also optimize with sharp (resize if too large, keep quality)
      try {
        const metadata = await sharp(fileBuffer).metadata()
        // Only process if image is very large (> 4000px wide)
        if (metadata.width && metadata.width > 4000) {
          fileBuffer = await sharp(fileBuffer)
            .resize(3000, undefined, { withoutEnlargement: true })
            .jpeg({ quality: 88, progressive: true })
            .toBuffer()
          finalMimeType = 'image/jpeg'
          finalExtension = 'jpg'
          finalSize = fileBuffer.length
        }
      } catch {
        // If sharp fails on non-HEIC, just upload original
      }
    }

    const fileName = `${uuidv4()}.${finalExtension}`
    const filePath = loftId ? `lofts/${loftId}/${fileName}` : `temp/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("loft-photos")
      .upload(filePath, fileBuffer, {
        contentType: finalMimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload] Storage error:', uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("loft-photos").getPublicUrl(filePath);

    let photoRecord: { id: string } | null = null;
    if (loftId) {
      const { data: insertData, error: insertError } = await supabase
        .from("loft_photos")
        .insert({
          loft_id: loftId,
          file_name: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          file_path: filePath,
          file_size: finalSize,
          mime_type: finalMimeType,
          url: urlData.publicUrl,
          uploaded_by: session.user.id,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from("loft-photos").remove([filePath]);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
      }
      photoRecord = insertData;
    }

    return NextResponse.json({
      id: photoRecord?.id,
      url: urlData.publicUrl,
      name: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      size: finalSize,
      path: filePath,
      converted: isHeic(file),
    });

  } catch (error) {
    console.error('[upload] Server error:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
