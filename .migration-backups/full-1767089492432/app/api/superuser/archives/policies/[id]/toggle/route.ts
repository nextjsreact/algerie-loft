import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const verification = await verifySuperuserAPI();
    if (!verification.authorized) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 403 }
      );
    }

    const { user } = verification;

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid enabled value' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: policy, error } = await supabase
      .from('archive_policies')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling archive policy:', error);
      return NextResponse.json(
        { error: 'Failed to toggle archive policy' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: enabled ? 'ENABLE_ARCHIVE_POLICY' : 'DISABLE_ARCHIVE_POLICY',
      resource_type: 'archive_policy',
      resource_id: params.id,
      details: { table_name: policy.table_name, enabled },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error in PATCH /api/superuser/archives/policies/[id]/toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
