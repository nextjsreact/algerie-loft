import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSuperuser } from '@/lib/superuser/auth';
import { logAuditEvent } from '@/lib/superuser/audit';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    let query = supabase
      .from('system_configurations')
      .select('*')
      .order('category', { ascending: true })
      .order('config_key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: configurations, error } = await query;

    if (error) {
      console.error('Error fetching system configurations:', error);
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
    }

    let configHistory = null;
    if (includeHistory) {
      const { data: history } = await supabase
        .from('superuser_audit_logs')
        .select('*')
        .eq('action_type', 'SYSTEM_CONFIG')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      configHistory = history;
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_CONFIG', 'VIEW_CONFIGURATIONS', {
      category,
      includeHistory,
      configurationsCount: configurations?.length || 0
    });

    return NextResponse.json({
      configurations,
      history: configHistory,
      categories: [...new Set(configurations?.map(c => c.category) || [])]
    });

  } catch (error) {
    console.error('System configuration API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { category, config_key, config_value, data_type, description, is_sensitive, requires_restart } = body;

    // Validate required fields
    if (!category || !config_key || config_value === undefined || !data_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, config_key, config_value, data_type' 
      }, { status: 400 });
    }

    // Check if configuration already exists
    const { data: existing } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', category)
      .eq('config_key', config_key)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Configuration already exists. Use PUT to update.' 
      }, { status: 409 });
    }

    // Create new configuration
    const { data: newConfig, error } = await supabase
      .from('system_configurations')
      .insert({
        category,
        config_key,
        config_value,
        data_type,
        description: description || null,
        is_sensitive: is_sensitive || false,
        requires_restart: requires_restart || false,
        modified_by: authResult.superuser!.id,
        modified_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating system configuration:', error);
      return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_CONFIG', 'CREATE_CONFIGURATION', {
      category,
      config_key,
      data_type,
      is_sensitive,
      requires_restart
    });

    return NextResponse.json({ configuration: newConfig }, { status: 201 });

  } catch (error) {
    console.error('System configuration creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}