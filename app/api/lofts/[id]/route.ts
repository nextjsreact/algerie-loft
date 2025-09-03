import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de loft requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Récupérer les informations du loft
    const { data: loft, error: fetchError } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Erreur récupération loft:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!loft) {
      return NextResponse.json(
        { error: "Loft non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ loft });
  } catch (error) {
    console.error("Erreur API loft:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}