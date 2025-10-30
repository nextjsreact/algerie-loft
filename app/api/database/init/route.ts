/**
 * Database Initialization API Route
 * 
 * Provides endpoints for manual database initialization and status checking.
 * Useful for development, debugging, and administrative tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeServerDatabase, getDatabaseStatus } from '@/lib/initialization/server-database-init';
import { requireAuthAPI } from '@/lib/auth';

/**
 * GET /api/database/init
 * Returns the current database initialization status
 */
export async function GET(request: NextRequest) {
  try {
    // Get database status
    const status = await getDatabaseStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting database status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/database/init
 * Manually trigger database initialization/seeding
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication for manual initialization
    const session = await requireAuthAPI();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required for manual database initialization' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { 
      forceReseed = false, 
      logLevel = 'info',
      useServiceRole = false 
    } = body;

    // Validate parameters
    if (typeof forceReseed !== 'boolean') {
      return NextResponse.json(
        { error: 'forceReseed must be a boolean' },
        { status: 400 }
      );
    }

    if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      return NextResponse.json(
        { error: 'logLevel must be one of: debug, info, warn, error' },
        { status: 400 }
      );
    }

    console.log(`[Database Init API] Manual initialization requested by user ${session.user.id}`);
    console.log(`[Database Init API] Parameters: forceReseed=${forceReseed}, logLevel=${logLevel}`);

    // Perform initialization
    const result = await initializeServerDatabase({
      forceReseed,
      logLevel,
      useServiceRole
    });

    // Get updated status
    const status = await getDatabaseStatus();

    return NextResponse.json({
      success: true,
      result,
      status,
      timestamp: new Date().toISOString(),
      requestedBy: session.user.id
    });

  } catch (error) {
    console.error('Error in manual database initialization:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/database/init
 * Clear seeding metadata (for development/testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuthAPI();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Metadata clearing not allowed in production' },
        { status: 403 }
      );
    }

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient(true); // Use service role

    // Clear seeding metadata
    const { error } = await supabase
      .from('seeding_metadata')
      .delete()
      .eq('table_name', 'lofts');

    if (error) {
      console.warn('Could not clear seeding metadata:', error.message);
      // Don't fail if metadata table doesn't exist
    }

    console.log(`[Database Init API] Seeding metadata cleared by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Seeding metadata cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing seeding metadata:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}