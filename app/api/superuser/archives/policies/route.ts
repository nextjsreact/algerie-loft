import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser access
    const verification = await verifySuperuserAPI();
    if (!verification.authorized) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 403 }
      );
    }

    const { user } = verification;

    const supabase = await createClient();

    // Fetch all archive policies
    const { data: policies, error } = await supabase
      .from('archive_policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching archive policies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch archive policies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error in GET /api/superuser/archives/policies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify superuser access
    const verification = await verifySuperuserAPI();
    if (!verification.authorized) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 403 }
      );
    }

    const { user } = verification;

    const body = await request.json();
    const { table_name, retention_days, frequency, enabled } = body;

    // Validation
    if (!table_name || !retention_days || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (retention_days < 1) {
      return NextResponse.json(
        { error: 'Retention days must be at least 1' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if policy already exists for this table
    const { data: existing } = await supabase
      .from('archive_policies')
      .select('id')
      .eq('table_name', table_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Archive policy already exists for this table' },
        { status: 409 }
      );
    }

    // Calculate next run time based on frequency
    const nextRun = calculateNextRun(frequency);

    // Create new policy
    const { data: policy, error } = await supabase
      .from('archive_policies')
      .insert({
        table_name,
        retention_days,
        frequency,
        enabled: enabled ?? true,
        next_run: nextRun,
        archived_count: 0,
        archived_size_mb: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating archive policy:', error);
      return NextResponse.json(
        { error: 'Failed to create archive policy' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE_ARCHIVE_POLICY',
      resource_type: 'archive_policy',
      resource_id: policy.id,
      details: { table_name, retention_days, frequency },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/superuser/archives/policies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNextRun(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'DAILY':
      now.setDate(now.getDate() + 1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'WEEKLY':
      now.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
      now.setHours(0, 0, 0, 0);
      break;
    case 'BIWEEKLY':
      now.setDate(now.getDate() + 14); // 2 weeks
      now.setHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'QUARTERLY':
      now.setMonth(now.getMonth() + 3);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'BIANNUAL':
      now.setMonth(now.getMonth() + 6);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
    case 'ANNUAL':
      now.setFullYear(now.getFullYear() + 1);
      now.setMonth(0);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
  }
  
  return now.toISOString();
}
