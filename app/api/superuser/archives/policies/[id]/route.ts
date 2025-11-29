import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(['superuser']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { retention_days, frequency, enabled } = body;

    if (!retention_days || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate new next_run if frequency changed
    const nextRun = calculateNextRun(frequency);

    const { data: policy, error } = await supabase
      .from('archive_policies')
      .update({
        retention_days,
        frequency,
        enabled,
        next_run: nextRun,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating archive policy:', error);
      return NextResponse.json(
        { error: 'Failed to update archive policy' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: authResult.user.id,
      action: 'UPDATE_ARCHIVE_POLICY',
      resource_type: 'archive_policy',
      resource_id: params.id,
      details: { retention_days, frequency, enabled },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error in PUT /api/superuser/archives/policies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(['superuser']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabase = await createClient();

    // Get policy details before deletion for logging
    const { data: policy } = await supabase
      .from('archive_policies')
      .select('*')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('archive_policies')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting archive policy:', error);
      return NextResponse.json(
        { error: 'Failed to delete archive policy' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: authResult.user.id,
      action: 'DELETE_ARCHIVE_POLICY',
      resource_type: 'archive_policy',
      resource_id: params.id,
      details: { table_name: policy?.table_name },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/superuser/archives/policies/[id]:', error);
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
      now.setDate(now.getDate() + (7 - now.getDay()));
      now.setHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
  }
  
  return now.toISOString();
}
