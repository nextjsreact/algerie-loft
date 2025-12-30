import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTasksWithoutLoft } from "@/app/actions/tasks";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can filter tasks without loft
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const tasks = await getTasksWithoutLoft();

    return NextResponse.json({ 
      tasks: tasks || [],
      total: tasks?.length || 0
    });
  } catch (error) {
    console.error("Erreur API tasks without loft:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}