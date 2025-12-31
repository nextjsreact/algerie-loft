import { NextRequest, NextResponse } from 'next/server';

interface UserEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  page: string;
  metadata?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: UserEvent[];
  userAgent: string;
  referrer: string;
  locale: string;
}

export async function POST(request: NextRequest) {
  try {
    // Timeout pour éviter les blocages
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 1000); // 1 seconde max
    });

    // Parse JSON avec timeout
    const jsonPromise = request.json();
    const session = await Promise.race([jsonPromise, timeoutPromise]) as UserSession;
    
    // Validation rapide
    if (!session.sessionId || !session.startTime || !Array.isArray(session.events)) {
      return NextResponse.json({ success: true, message: 'Invalid data ignored' });
    }
    
    // Calculs rapides
    const sessionDuration = session.lastActivity - session.startTime;
    const uniquePages = new Set(session.events.map(e => e.page)).size;
    const totalInteractions = session.events.filter(e => e.category === 'interaction').length;
    
    // Log minimal en développement seulement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics Session] ${session.sessionId.substring(0, 8)}... - ${Math.round(sessionDuration/1000)}s, ${session.pageViews} pages`);
    }
    
    // Réponse immédiate avec métriques basiques
    return NextResponse.json({ 
      success: true,
      metrics: {
        duration: sessionDuration,
        pageViews: session.pageViews,
        uniquePages,
        totalInteractions
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ success: true, message: 'Timeout ignored' });
    }
    
    // Log minimal des erreurs
    console.error('[Analytics Session] Error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: true }); // Toujours réussir
  }
}