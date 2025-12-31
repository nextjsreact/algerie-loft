import { NextRequest, NextResponse } from 'next/server';

interface PageEngagement {
  page: string;
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  bounced: boolean;
}

interface EngagementRequest {
  sessionId: string;
  engagement: PageEngagement;
}

export async function POST(request: NextRequest) {
  try {
    // Timeout pour éviter les blocages
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 1500); // 1.5 secondes max
    });

    // Parse JSON avec timeout
    const jsonPromise = request.json();
    const body = await Promise.race([jsonPromise, timeoutPromise]) as EngagementRequest;
    
    const { sessionId, engagement } = body;
    
    // Validation rapide
    if (!sessionId || !engagement || !engagement.page || typeof engagement.timeOnPage !== 'number') {
      return NextResponse.json({ success: true, message: 'Invalid data ignored' });
    }
    
    // Log minimal en développement seulement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${engagement.page} - ${Math.round(engagement.timeOnPage/1000)}s`);
    }
    
    // Réponse immédiate
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ success: true, message: 'Timeout ignored' });
    }
    
    // Log minimal des erreurs
    console.error('[Analytics Engagement] Error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: true }); // Toujours réussir
  }
}