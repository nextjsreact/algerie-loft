import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTasksWithOrphanedLofts, cleanupOrphanedLoftReferences } from "@/app/actions/tasks";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can view orphaned tasks
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const orphanedTasks = await getTasksWithOrphanedLofts();

    return NextResponse.json({ 
      tasks: orphanedTasks,
      total: orphanedTasks.length
    });
  } catch (error) {
    console.error("Erreur API orphaned tasks:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins can cleanup orphaned references
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const result = await cleanupOrphanedLoftReferences();

    return NextResponse.json({ 
      message: `${result.cleaned} références orphelines nettoyées`,
      ...result
    });
  } catch (error) {
    console.error("Erreur cleanup orphaned references:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}