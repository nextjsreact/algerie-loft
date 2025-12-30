import { NextRequest, NextResponse } from 'next/server';
import { loftDataService } from '@/lib/services/loft-data-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Loft details request for ID:', id);

    const loft = await loftDataService.getLoftById(id);

    if (!loft) {
      return NextResponse.json({
        success: false,
        error: 'Loft non trouvé',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      loft,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Loft details error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des détails du loft',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}