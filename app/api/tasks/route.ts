import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTasks, getTasksWithLoftInfo } from "@/app/actions/tasks";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeLoftDetails = searchParams.get('includeLoftDetails') === 'true';

    // Get tasks with or without extended loft information
    const tasks = includeLoftDetails ? await getTasksWithLoftInfo() : await getTasks();

    return NextResponse.json({ 
      tasks: tasks || [],
      total: tasks?.length || 0
    });
  } catch (error) {
    console.error("Erreur API tasks:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}