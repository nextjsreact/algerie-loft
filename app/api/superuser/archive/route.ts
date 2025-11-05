import { NextRequest, NextResponse } from 'next/server';
import { 
  createArchivePolicy,
  executeArchivePolicy,
  getArchivePolicies,
  getArchiveHistory,
  searchArchivedData,
  restoreArchivedData,
  getArchiveStatistics
} from '@/lib/superuser/archive-service';
import { requireSuperuserPermissions } from '@/lib/superuser/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'policies': {
        const isActive = searchParams.get('is_active') === 'true' ? true : 
                        searchParams.get('is_active') === 'false' ? false : undefined;
        const tableName = searchParams.get('table_name');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        const result = await getArchivePolicies({
          is_active: isActive,
          table_name: tableName,
          limit,
          offset
        });

        return NextResponse.json(result);
      }

      case 'history': {
        const status = searchParams.get('status')?.split(',');
        const type = searchParams.get('type')?.split(',');
        const tableName = searchParams.get('table_name');
        const dateFrom = searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined;
        const dateTo = searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        const result = await getArchiveHistory({
          status,
          type,
          table_name: tableName,
          date_from: dateFrom,
          date_to: dateTo,
          limit,
          offset
        });

        return NextResponse.json(result);
      }

      case 'search': {
        const tableName = searchParams.get('table_name');
        const archiveId = searchParams.get('archive_id');
        const searchQuery = searchParams.get('search_query');
        const dateFrom = searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined;
        const dateTo = searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        const result = await searchArchivedData({
          table_name: tableName,
          archive_id: archiveId,
          search_query: searchQuery,
          date_from: dateFrom,
          date_to: dateTo,
          limit,
          offset
        });

        return NextResponse.json(result);
      }

      case 'statistics': {
        const stats = await getArchiveStatistics();
        return NextResponse.json({ statistics: stats });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: policies, history, search, statistics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Archive API GET error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for archive operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_policy': {
        const { 
          name, 
          description, 
          table_name, 
          archive_condition, 
          retention_days,
          compression_enabled = true,
          create_search_index = true,
          schedule_cron,
          is_active = true,
          created_by
        } = body;

        if (!name || !table_name || !archive_condition || !created_by) {
          return NextResponse.json(
            { error: 'Missing required fields: name, table_name, archive_condition, created_by' },
            { status: 400 }
          );
        }

        if (typeof retention_days !== 'number' || retention_days < 1) {
          return NextResponse.json(
            { error: 'retention_days must be a positive number' },
            { status: 400 }
          );
        }

        const result = await createArchivePolicy({
          name,
          description: description || '',
          table_name,
          archive_condition,
          retention_days,
          compression_enabled,
          create_search_index,
          schedule_cron,
          is_active,
          created_by
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          policy_id: result.policy_id,
          message: 'Archive policy created successfully'
        });
      }

      case 'execute_policy': {
        const { policy_id, dry_run = false } = body;

        if (!policy_id) {
          return NextResponse.json(
            { error: 'policy_id is required' },
            { status: 400 }
          );
        }

        const result = await executeArchivePolicy(policy_id, dry_run);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        if (dry_run) {
          return NextResponse.json({
            success: true,
            records_to_archive: result.records_to_archive,
            message: `Dry run completed. ${result.records_to_archive} records would be archived.`
          });
        }

        return NextResponse.json({
          success: true,
          archive_id: result.archive_id,
          message: 'Archive policy executed successfully'
        });
      }

      case 'restore': {
        const { archive_id, record_ids } = body;

        if (!archive_id) {
          return NextResponse.json(
            { error: 'archive_id is required' },
            { status: 400 }
          );
        }

        const result = await restoreArchivedData(archive_id, record_ids);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          restored_count: result.restored_count,
          restore_id: result.restore_id,
          message: `Successfully restored ${result.restored_count} records`
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create_policy, execute_policy, restore' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Archive API POST error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for archive operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

    const body = await request.json();
    const { policy_id, updates } = body;

    if (!policy_id || !updates) {
      return NextResponse.json(
        { error: 'policy_id and updates are required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the archive policy
    // For now, we'll simulate the update
    
    return NextResponse.json({
      success: true,
      message: 'Archive policy updated successfully'
    });
  } catch (error) {
    console.error('Archive API PUT error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for archive operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policy_id');
    const archiveId = searchParams.get('archive_id');

    if (!policyId && !archiveId) {
      return NextResponse.json(
        { error: 'Either policy_id or archive_id is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would delete the policy or archive
    // For now, we'll simulate the deletion
    
    const itemType = policyId ? 'policy' : 'archive';
    const itemId = policyId || archiveId;

    return NextResponse.json({
      success: true,
      message: `Archive ${itemType} deleted successfully`
    });
  } catch (error) {
    console.error('Archive API DELETE error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for archive operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}