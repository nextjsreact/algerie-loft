/**
 * Performance alerts management API endpoint
 * Allows viewing and managing performance alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth';
import { globalAlertManager } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has admin or manager role
    const userRole = session.user?.role;
    if (!['admin', 'manager', 'executive'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const activeAlerts = globalAlertManager.getActiveAlerts();
    const alertHistory = globalAlertManager.getAlertHistory(limit);
    const stats = globalAlertManager.getStats();

    const response = {
      timestamp: Date.now(),
      stats,
      activeAlerts,
      ...(includeResolved && { alertHistory })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has admin role for alert management
    const userRole = session.user?.role;
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, alertId } = body;

    switch (action) {
      case 'resolve':
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }
        
        const resolved = globalAlertManager.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Alert resolved' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing alerts:', error);
    return NextResponse.json(
      { error: 'Failed to manage alerts' },
      { status: 500 }
    );
  }
}