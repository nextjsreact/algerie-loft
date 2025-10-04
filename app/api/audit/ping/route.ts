import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/audit/ping
 * Simple ping endpoint to test API functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏓 Audit ping endpoint called');
    
    return NextResponse.json({
      success: true,
      message: "Audit API is working",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });

  } catch (error) {
    console.error('❌ Ping endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Ping failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}