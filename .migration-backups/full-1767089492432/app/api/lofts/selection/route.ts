import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can access loft selection for tasks
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabase
      .from("lofts")
      .select("id, name, address")
      .order("name", { ascending: true });

    // Add search functionality if search parameter is provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data: lofts, error: fetchError } = await query;

    if (fetchError) {
      console.error("Erreur récupération lofts pour sélection:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des lofts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      lofts: lofts || [],
      total: lofts?.length || 0
    });
  } catch (error) {
    console.error("Erreur API lofts selection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}