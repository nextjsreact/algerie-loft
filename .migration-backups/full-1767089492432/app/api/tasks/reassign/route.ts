import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { reassignOrphanedTasksToLoft } from "@/app/actions/tasks";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can reassign tasks
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { newLoftId, taskIds } = await request.json();

    if (!newLoftId || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ 
        error: "newLoftId et taskIds sont requis" 
      }, { status: 400 });
    }

    const result = await reassignOrphanedTasksToLoft(newLoftId, taskIds);

    return NextResponse.json({ 
      message: `${result.reassigned} tâches réassignées au loft ${result.loft.name}`,
      ...result
    });
  } catch (error) {
    console.error("Erreur reassign tasks:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 });
  }
}