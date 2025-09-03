import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer tous les lofts
    const { data: lofts, error: fetchError } = await supabase
      .from("lofts")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Erreur récupération lofts:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lofts: lofts || [] });
  } catch (error) {
    console.error("Erreur API lofts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}