import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { searchUsers, exportUserData } from '@/lib/superuser/user-search';
import type { AdvancedUserSearchFilters } from '@/lib/superuser/user-search';

export async function POST(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      filters, 
      page = 1, 
      limit = 50, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      includeDeleted = false 
    } = body;

    // Validate filters
    const searchFilters: AdvancedUserSearchFilters = {
      ...filters,
      includeDeleted
    };

    // Perform advanced search
    const result = await searchUsers(searchFilters, {
      page,
      limit,
      sortBy,
      sortOrder
    });

    // Log search activity
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'advanced_user_search',
      filters: searchFilters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      resultCount: result.users.length
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in advanced user search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const export_format = searchParams.get('export') as 'csv' | 'json' | null;
    
    if (!export_format) {
      return NextResponse.json(
        { error: 'Export format is required (csv or json)' },
        { status: 400 }
      );
    }

    // Parse filters from query parameters
    const filters: AdvancedUserSearchFilters = {
      role: searchParams.get('role') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
      createdAfter: searchParams.get('createdAfter') ? new Date(searchParams.get('createdAfter')!) : undefined,
      createdBefore: searchParams.get('createdBefore') ? new Date(searchParams.get('createdBefore')!) : undefined,
      lastLoginAfter: searchParams.get('lastLoginAfter') ? new Date(searchParams.get('lastLoginAfter')!) : undefined,
      lastLoginBefore: searchParams.get('lastLoginBefore') ? new Date(searchParams.get('lastLoginBefore')!) : undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true'
    };

    // Export user data
    const exportResult = await exportUserData(filters, export_format);

    if (!exportResult.success) {
      return NextResponse.json(
        { error: exportResult.error },
        { status: 500 }
      );
    }

    // Log export activity
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'export_user_data',
      filters,
      export_format,
      recordCount: exportResult.recordCount
    }, { severity: 'HIGH' });

    // Set appropriate headers for file download
    const headers = new Headers();
    
    if (export_format === 'csv') {
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`);
    } else {
      headers.set('Content-Type', 'application/json');
      headers.set('Content-Disposition', `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.json"`);
    }

    return new NextResponse(exportResult.data, { headers });

  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}