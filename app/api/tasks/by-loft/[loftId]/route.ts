import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTasksByLoft } from "@/app/actions/tasks";

export async function GET(
  request: NextRequest,
  { params }: { params: { loftId: string } }
) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can filter tasks by loft
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const tasks = await getTasksByLoft(params.loftId);

    return NextResponse.json({ 
      tasks: tasks || [],
      total: tasks?.length || 0,
      loftId: params.loftId
    });
  } catch (error) {
    console.error("Erreur API tasks by loft:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}