import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSuperuser } from '@/lib/superuser/auth';
import { logAuditEvent } from '@/lib/superuser/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify superuser permissions
    const authResult = await requireSuperuser(supabase, ['SYSTEM_CONFIG']);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current configuration
    const { data: currentConfig, error: fetchError } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Check if there's a previous value to rollback to
    if (!currentConfig.previous_value) {
      return NextResponse.json({ 
        error: 'No previous value available for rollback' 
      }, { status: 400 });
    }

    // Check rollback time window (24 hours by default)
    const rollbackWindowHours = 24;
    const modifiedAt = new Date(currentConfig.modified_at);
    const now = new Date();
    const hoursSinceModification = (now.getTime() - modifiedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceModification > rollbackWindowHours) {
      return NextResponse.json({ 
        error: `Rollback window expired. Changes older than ${rollbackWindowHours} hours cannot be rolled back.` 
      }, { status: 400 });
    }

    // Perform rollback
    const { data: rolledBackConfig, error: rollbackError } = await supabase
      .from('system_configurations')
      .update({
        config_value: currentConfig.previous_value,
        previous_value: currentConfig.config_value, // Store current as previous
        modified_by: authResult.superuser!.id,
        modified_at: new Date().toISOString(),
        previous_modified_by: currentConfig.modified_by,
        previous_modified_at: currentConfig.modified_at
      })
      .eq('id', params.id)
      .select()
      .single();

    if (rollbackError) {
      console.error('Error rolling back configuration:', rollbackError);
      return NextResponse.json({ error: 'Failed to rollback configuration' }, { status: 500 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_CONFIG', 'ROLLBACK_CONFIGURATION', {
      configurationId: params.id,
      category: currentConfig.category,
      config_key: currentConfig.config_key,
      rolledBackFrom: currentConfig.config_value,
      rolledBackTo: currentConfig.previous_value,
      originalModifiedBy: currentConfig.previous_modified_by,
      originalModifiedAt: currentConfig.previous_modified_at
    });

    return NextResponse.json({ 
      configuration: rolledBackConfig,
      message: 'Configuration successfully rolled back',
      requiresRestart: rolledBackConfig.requires_restart
    });

  } catch (error) {
    console.error('Configuration rollback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}