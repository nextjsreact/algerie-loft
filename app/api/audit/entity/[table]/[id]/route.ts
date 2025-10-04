import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { AuditService } from "@/lib/services/audit-service";
import type { AuditableTable } from "@/lib/types";

// Valid table names for audit
const VALID_TABLES: AuditableTable[] = ['transactions', 'tasks', 'reservations', 'lofts'];

/**
 * GET /api/audit/entity/[table]/[id]
 * Retrieve audit history for a specific entity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  let session: any = null;
  let table: string = '';
  let id: string = '';
  
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    console.log('🔍 Audit API called with params:', resolvedParams);
    
    // Extract params safely
    table = resolvedParams?.table || '';
    id = resolvedParams?.id || '';
    
    console.log('📋 Extracted params:', { table, id });
    
    // Require authentication
    session = await requireAuthAPI();
    console.log('🔐 Session check:', session ? 'authenticated' : 'not authenticated');

    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    console.log('👤 User role:', session.user.role);

    // Check if user has audit permissions (admin or manager only)
    if (!['admin', 'manager'].includes(session.user.role)) {
      console.log('❌ Insufficient permissions for role:', session.user.role);
      return NextResponse.json(
        { error: "Permissions insuffisantes pour accéder aux logs d'audit" },
        { status: 403 }
      );
    }

    // Params already extracted above

    // Validate table parameter
    if (!table) {
      return NextResponse.json(
        { error: "Nom de table requis" },
        { status: 400 }
      );
    }

    if (!VALID_TABLES.includes(table as AuditableTable)) {
      return NextResponse.json(
        { 
          error: "Nom de table invalide", 
          validTables: VALID_TABLES 
        },
        { status: 400 }
      );
    }

    // Validate record ID parameter
    if (!id) {
      return NextResponse.json(
        { error: "ID d'enregistrement requis" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Format d'ID invalide (UUID requis)" },
        { status: 400 }
      );
    }

    console.log('📊 Fetching audit history for:', { table, id });

    // Retrieve audit history for the entity
    const auditHistory = await AuditService.getEntityAuditHistory(table, id);
    
    console.log('✅ Audit history retrieved:', { count: auditHistory.length });

    return NextResponse.json({
      success: true,
      data: {
        tableName: table,
        recordId: id,
        auditHistory,
        total: auditHistory.length
      }
    });

  } catch (error) {
    console.error("Erreur API audit entity:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      table,
      id,
      userRole: session?.user?.role
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch entity audit history')) {
        return NextResponse.json(
          { error: "Erreur lors de la récupération de l'historique d'audit", details: error.message },
          { status: 500 }
        );
      }
      
      // Return more specific error information in development
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          { error: "Erreur serveur interne", details: error.message, stack: error.stack },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}