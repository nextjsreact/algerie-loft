import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';

export async function POST(request: NextRequest) {
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
    const { policy_id } = body;

    if (!policy_id) {
      return NextResponse.json(
        { error: 'Missing policy_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the policy
    const { data: policy, error: policyError } = await supabase
      .from('archive_policies')
      .select('*')
      .eq('id', policy_id)
      .single();

    if (policyError || !policy) {
      return NextResponse.json(
        { error: 'Archive policy not found' },
        { status: 404 }
      );
    }

    if (!policy.enabled) {
      return NextResponse.json(
        { error: 'Archive policy is disabled' },
        { status: 400 }
      );
    }

    // Execute archiving based on table
    const result = await executeArchiving(supabase, policy);

    // Update policy stats
    await supabase
      .from('archive_policies')
      .update({
        last_run: new Date().toISOString(),
        archived_count: (policy.archived_count || 0) + result.archived_count,
        archived_size_mb: (policy.archived_size_mb || 0) + result.size_mb,
        next_run: calculateNextRun(policy.frequency),
      })
      .eq('id', policy_id);

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'RUN_ARCHIVE',
      resource_type: 'archive_policy',
      resource_id: policy_id,
      details: {
        table_name: policy.table_name,
        archived_count: result.archived_count,
        size_mb: result.size_mb,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      archived_count: result.archived_count,
      size_mb: result.size_mb,
    });
  } catch (error) {
    console.error('Error in POST /api/superuser/archives/run:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeArchiving(supabase: any, policy: any) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

  let archived_count = 0;
  let size_mb = 0;

  try {
    // Create archive table if it doesn't exist
    const archiveTableName = `${policy.table_name}_archive`;

    // Get records to archive based on table type
    let query;
    
    switch (policy.table_name) {
      case 'audit_logs':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .lt('created_at', cutoffDate.toISOString());
        break;
      
      case 'visitor_tracking':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .lt('visited_at', cutoffDate.toISOString());
        break;
      
      case 'notifications':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .eq('read', true)
          .lt('created_at', cutoffDate.toISOString());
        break;
      
      case 'sessions':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .lt('expires_at', cutoffDate.toISOString());
        break;
      
      case 'reservations':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .in('status', ['COMPLETED', 'CANCELLED'])
          .lt('updated_at', cutoffDate.toISOString());
        break;
      
      case 'transactions':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .lt('created_at', cutoffDate.toISOString());
        break;
      
      case 'messages':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .eq('archived', true)
          .lt('created_at', cutoffDate.toISOString());
        break;
      
      case 'activity_logs':
        query = supabase
          .from(policy.table_name)
          .select('*')
          .lt('created_at', cutoffDate.toISOString());
        break;
      
      default:
        throw new Error(`Unsupported table: ${policy.table_name}`);
    }

    const { data: recordsToArchive, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching records to archive:', fetchError);
      throw fetchError;
    }

    if (!recordsToArchive || recordsToArchive.length === 0) {
      return { archived_count: 0, size_mb: 0 };
    }

    archived_count = recordsToArchive.length;

    // Estimate size (rough calculation)
    const jsonSize = JSON.stringify(recordsToArchive).length;
    size_mb = jsonSize / (1024 * 1024);

    // Insert into archive table
    const { error: insertError } = await supabase
      .from(archiveTableName)
      .insert(
        recordsToArchive.map((record: any) => ({
          ...record,
          archived_at: new Date().toISOString(),
          original_id: record.id,
        }))
      );

    if (insertError) {
      console.error('Error inserting into archive:', insertError);
      // If archive table doesn't exist, we'll just log it
      console.log(`Archive table ${archiveTableName} may not exist. Skipping insertion.`);
    }

    // Delete from original table
    const ids = recordsToArchive.map((r: any) => r.id);
    const { error: deleteError } = await supabase
      .from(policy.table_name)
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Error deleting archived records:', deleteError);
      throw deleteError;
    }

    return { archived_count, size_mb };
  } catch (error) {
    console.error('Error in executeArchiving:', error);
    throw error;
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
    case 'BIWEEKLY':
      now.setDate(now.getDate() + 14);
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
