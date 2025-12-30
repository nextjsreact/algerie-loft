import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { 
  getTaskLoftAnalytics, 
  getTaskCompletionRateByLoft, 
  getTaskDistributionByLoft 
} from "@/lib/services/task-loft-analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only admins and managers can access analytics
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';

    let result;

    switch (type) {
      case 'completion-rate':
        result = await getTaskCompletionRateByLoft();
        return NextResponse.json({ 
          type: 'completion-rate',
          data: result 
        });

      case 'distribution':
        result = await getTaskDistributionByLoft();
        return NextResponse.json({ 
          type: 'distribution',
          data: result 
        });

      case 'full':
      default:
        const [analytics, completionRates, distribution] = await Promise.all([
          getTaskLoftAnalytics(),
          getTaskCompletionRateByLoft(),
          getTaskDistributionByLoft()
        ]);

        return NextResponse.json({ 
          type: 'full',
          analytics,
          completionRates,
          distribution,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error("Erreur API task analytics:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 });
  }
}