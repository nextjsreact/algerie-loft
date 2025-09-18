import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTask } from "@/app/actions/tasks";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const task = await getTask(params.id);

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Check if user has permission to view this task
    const canView = 
      session.user.role === 'admin' || 
      session.user.role === 'manager' || 
      task.assigned_to === session.user.id ||
      task.user_id === session.user.id;

    if (!canView) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Erreur API task:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}