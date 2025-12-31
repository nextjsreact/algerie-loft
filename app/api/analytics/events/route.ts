import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Timeout pour éviter les blocages
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 2000); // 2 secondes max
    });

    // Lire le body avec timeout
    const textPromise = request.text();
    const text = await Promise.race([textPromise, timeoutPromise]) as string;
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ success: true, message: 'Empty body ignored' });
    }

    // Parser le JSON rapidement
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      // Ignorer silencieusement les erreurs JSON pour éviter les logs
      return NextResponse.json({ success: true, message: 'Invalid JSON ignored' });
    }

    const { sessionId, event } = body;

    // Validation rapide
    if (!sessionId || !event) {
      return NextResponse.json({ success: true, message: 'Missing fields ignored' });
    }

    // Log minimal pour éviter les performances
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event.type || 'event'} - ${sessionId.substring(0, 8)}...`);
    }

    // Réponse immédiate
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ success: true, message: 'Timeout ignored' });
    }
    
    // Log minimal des erreurs
    console.error('[Analytics] Error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: true }); // Toujours réussir pour éviter les blocages
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Analytics events endpoint' });
}