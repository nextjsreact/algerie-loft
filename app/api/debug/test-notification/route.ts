import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true);

    // 1. Check columns in notifications table
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'notifications' })
      .select('*');

    // 2. Try a direct insert with title/message
    const testUserId = request.nextUrl.searchParams.get('user_id');
    
    let insertResult = null;
    let insertError = null;

    if (testUserId) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          title: 'Test notification',
          message: 'Ceci est un test de notification',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select();
      insertResult = data;
      insertError = error;
    }

    // 3. Fetch latest notifications
    const { data: latest, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, title_key, message_key, type, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      columns: columns || 'RPC not available',
      colError: colError?.message,
      insertResult,
      insertError: insertError ? { code: insertError.code, message: insertError.message } : null,
      latest,
      fetchError: fetchError?.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
