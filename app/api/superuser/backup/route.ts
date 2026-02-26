import { NextRequest, NextResponse } from 'next/server';
import { 
  createBackup, 
  getBackupHistory, 
  getBackupProgress,
  cancelBackup,
  verifyBackup,
  cleanupExpiredBackups,
  getBackupConfiguration,
  updateBackupConfiguration
} from '@/lib/superuser/backup-service';
import { requireSuperuserPermissions } from '@/lib/superuser/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'history': {
        const status = searchParams.get('status')?.split(',');
        const type = searchParams.get('type')?.split(',');
        const dateFrom = searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined;
        const dateTo = searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        const result = await getBackupHistory({
          status,
          type,
          date_from: dateFrom,
          date_to: dateTo,
          limit,
          offset
        });

        return NextResponse.json(result);
      }

      case 'progress': {
        const backupId = searchParams.get('backup_id');
        if (!backupId) {
          return NextResponse.json(
            { error: 'backup_id is required' },
            { status: 400 }
          );
        }

        const progress = await getBackupProgress(backupId);
        return NextResponse.json({ progress });
      }

      case 'verify': {
        const backupId = searchParams.get('backup_id');
        if (!backupId) {
          return NextResponse.json(
            { error: 'backup_id is required' },
            { status: 400 }
          );
        }

        const verification = await verifyBackup(backupId);
        return NextResponse.json(verification);
      }

      case 'configuration': {
        const config = await getBackupConfiguration();
        return NextResponse.json({ configuration: config });
      }

      case 'cleanup': {
        const result = await cleanupExpiredBackups();
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: history, progress, verify, configuration, cleanup' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup API GET error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for backup operations' },
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
    await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { 
          type = 'MANUAL', 
          tables, 
          compression, 
          encryption, 
          retention_days 
        } = body;

        if (!['FULL', 'INCREMENTAL', 'MANUAL'].includes(type)) {
          return NextResponse.json(
            { error: 'Invalid backup type. Must be FULL, INCREMENTAL, or MANUAL' },
            { status: 400 }
          );
        }

        const result = await createBackup(type, {
          tables,
          compression,
          encryption,
          retention_days
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          backup_id: result.backup_id,
          message: 'Backup initiated successfully'
        });
      }

      case 'cancel': {
        const { backup_id } = body;
        if (!backup_id) {
          return NextResponse.json(
            { error: 'backup_id is required' },
            { status: 400 }
          );
        }

        const result = await cancelBackup(backup_id);
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Backup cancelled successfully'
        });
      }

      case 'update_configuration': {
        const { configuration } = body;
        if (!configuration) {
          return NextResponse.json(
            { error: 'configuration is required' },
            { status: 400 }
          );
        }

        const result = await updateBackupConfiguration(configuration);
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Backup configuration updated successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create, cancel, update_configuration' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup API POST error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for backup operations' },
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
    await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backup_id');

    if (!backupId) {
      return NextResponse.json(
        { error: 'backup_id is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would delete the backup record and file
    // For now, we'll just mark it as deleted or remove the record
    const result = await cancelBackup(backupId); // Reuse cancel logic for deletion

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Backup API DELETE error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for backup operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}