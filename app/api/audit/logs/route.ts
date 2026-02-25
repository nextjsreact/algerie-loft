import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { AuditService } from "@/lib/services/audit-service";
import type { AuditFilters } from "@/lib/types";

/**
 * GET /api/audit/logs
 * Retrieve audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // Check if user has audit permissions (admin or manager only)
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes pour accéder aux logs d'audit" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: AuditFilters = {};
    
    if (searchParams.get('tableName')) {
      const validTables = ['transactions', 'tasks', 'reservations', 'lofts'];
      const tableName = searchParams.get('tableName')!;
      if (!validTables.includes(tableName)) {
        return NextResponse.json(
          { error: "Nom de table invalide", validTables },
          { status: 400 }
        );
      }
      filters.tableName = tableName;
    }
    
    if (searchParams.get('recordId')) {
      // Validate UUID format
      const recordId = searchParams.get('recordId')!;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(recordId)) {
        return NextResponse.json(
          { error: "Format d'ID d'enregistrement invalide (UUID requis)" },
          { status: 400 }
        );
      }
      filters.recordId = recordId;
    }
    
    if (searchParams.get('userId')) {
      filters.userId = searchParams.get('userId')!;
    }
    
    if (searchParams.get('action')) {
      const action = searchParams.get('action')!;
      const validActions = ['INSERT', 'UPDATE', 'DELETE'];
      if (!validActions.includes(action)) {
        return NextResponse.json(
          { error: "Action invalide", validActions },
          { status: 400 }
        );
      }
      filters.action = action;
    }
    
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = searchParams.get('dateFrom')!;
    }
    
    if (searchParams.get('dateTo')) {
      filters.dateTo = searchParams.get('dateTo')!;
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: "Paramètres de pagination invalides" },
        { status: 400 }
      );
    }

    // Retrieve audit logs
    const result = await AuditService.getAuditLogs(filters, page, limit);

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });

  } catch (error) {
    console.error("Erreur API audit logs:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch audit logs')) {
        return NextResponse.json(
          { error: "Erreur lors de la récupération des logs d'audit" },
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