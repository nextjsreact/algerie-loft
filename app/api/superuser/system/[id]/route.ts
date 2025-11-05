import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSuperuser } from '@/lib/superuser/auth';
import { logAuditEvent } from '@/lib/superuser/audit';

export async function GET(
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

    const { data: configuration, error } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ configuration });

  } catch (error) {
    console.error('System configuration fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { config_value, description, is_sensitive, requires_restart } = body;

    // Get current configuration for backup
    const { data: currentConfig, error: fetchError } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Create backup of current configuration
    const { error: backupError } = await supabase
      .from('system_configurations')
      .update({
        previous_value: currentConfig.config_value,
        previous_modified_at: currentConfig.modified_at,
        previous_modified_by: currentConfig.modified_by
      })
      .eq('id', params.id);

    if (backupError) {
      console.error('Error creating configuration backup:', backupError);
      return NextResponse.json({ error: 'Failed to backup current configuration' }, { status: 500 });
    }

    // Update configuration
    const updateData: any = {
      modified_by: authResult.superuser!.id,
      modified_at: new Date().toISOString()
    };

    if (config_value !== undefined) updateData.config_value = config_value;
    if (description !== undefined) updateData.description = description;
    if (is_sensitive !== undefined) updateData.is_sensitive = is_sensitive;
    if (requires_restart !== undefined) updateData.requires_restart = requires_restart;

    const { data: updatedConfig, error: updateError } = await supabase
      .from('system_configurations')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating system configuration:', updateError);
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_CONFIG', 'UPDATE_CONFIGURATION', {
      configurationId: params.id,
      category: currentConfig.category,
      config_key: currentConfig.config_key,
      previousValue: currentConfig.config_value,
      newValue: config_value,
      requires_restart: updatedConfig.requires_restart
    });

    return NextResponse.json({ 
      configuration: updatedConfig,
      requiresRestart: updatedConfig.requires_restart
    });

  } catch (error) {
    console.error('System configuration update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get configuration details before deletion
    const { data: configuration, error: fetchError } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Delete configuration
    const { error: deleteError } = await supabase
      .from('system_configurations')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting system configuration:', deleteError);
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_CONFIG', 'DELETE_CONFIGURATION', {
      configurationId: params.id,
      category: configuration.category,
      config_key: configuration.config_key,
      deletedValue: configuration.config_value
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('System configuration deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}