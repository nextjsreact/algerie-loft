import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { AuditService } from "@/lib/services/audit-service";
import type { AuditFilters } from "@/lib/types";

/**
 * POST /api/audit/export
 * Export audit logs with various format and field options
 */
export async function POST(request: NextRequest) {
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
        { error: "Permissions insuffisantes pour exporter les logs d'audit" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      filters = {}, 
      format = 'csv', 
      fields = [], 
      includeValues = false 
    } = body;

    // Validate format
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: "Format d'export invalide. Utilisez 'csv' ou 'json'" },
        { status: 400 }
      );
    }

    // Validate filters
    const validatedFilters: AuditFilters = {};
    
    if (filters.tableName) {
      const validTables = ['transactions', 'tasks', 'reservations', 'lofts'];
      if (!validTables.includes(filters.tableName)) {
        return NextResponse.json(
          { error: "Nom de table invalide", validTables },
          { status: 400 }
        );
      }
      validatedFilters.tableName = filters.tableName;
    }

    if (filters.recordId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(filters.recordId)) {
        return NextResponse.json(
          { error: "Format d'ID d'enregistrement invalide (UUID requis)" },
          { status: 400 }
        );
      }
      validatedFilters.recordId = filters.recordId;
    }

    if (filters.userId) {
      validatedFilters.userId = filters.userId;
    }

    if (filters.action) {
      const validActions = ['INSERT', 'UPDATE', 'DELETE'];
      if (!validActions.includes(filters.action)) {
        return NextResponse.json(
          { error: "Action invalide", validActions },
          { status: 400 }
        );
      }
      validatedFilters.action = filters.action;
    }

    if (filters.dateFrom) {
      validatedFilters.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      validatedFilters.dateTo = filters.dateTo;
    }

    if (filters.search) {
      validatedFilters.search = filters.search;
    }

    // Export audit logs
    const exportResult = await AuditService.exportAuditLogs(validatedFilters, {
      format,
      fields,
      includeValues,
      batchSize: 1000
    });

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-logs-${timestamp}.${format}`;
    
    const headers = new Headers();
    headers.set('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('X-Total-Records', exportResult.totalRecords.toString());

    return new NextResponse(exportResult.data, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Erreur API export audit:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch audit logs')) {
        return NextResponse.json(
          { error: "Erreur lors de l'export des logs d'audit" },
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

/**
 * GET /api/audit/export/progress
 * Get export progress information for large datasets
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
        { error: "Permissions insuffisantes pour accéder aux informations d'export" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: AuditFilters = {};
    
    if (searchParams.get('tableName')) {
      filters.tableName = searchParams.get('tableName')!;
    }
    
    if (searchParams.get('recordId')) {
      filters.recordId = searchParams.get('recordId')!;
    }
    
    if (searchParams.get('userId')) {
      filters.userId = searchParams.get('userId')!;
    }
    
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action')!;
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

    // Get export progress
    const progress = await AuditService.getExportProgress(filters);

    return NextResponse.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error("Erreur API progress export audit:", error);
    
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}