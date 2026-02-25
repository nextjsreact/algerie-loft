import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Create wrapper functions in public schema
    const sql = `
      -- Wrapper for set_audit_user_context
      CREATE OR REPLACE FUNCTION public.set_audit_user_context(
          p_user_id UUID,
          p_user_email VARCHAR(255) DEFAULT NULL
      )
      RETURNS VOID AS $$
      BEGIN
          PERFORM audit.set_audit_user_context(p_user_id, p_user_email);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Wrapper for clear_audit_user_context
      CREATE OR REPLACE FUNCTION public.clear_audit_user_context()
      RETURNS VOID AS $$
      BEGIN
          PERFORM audit.clear_audit_user_context();
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create a view in public schema for audit_logs
      CREATE OR REPLACE VIEW public.audit_logs AS
      SELECT * FROM audit.audit_logs;

      -- Grant permissions
      GRANT EXECUTE ON FUNCTION public.set_audit_user_context(UUID, VARCHAR) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.clear_audit_user_context() TO authenticated;
      GRANT SELECT ON public.audit_logs TO authenticated;
    `

    // Execute SQL using Supabase SQL editor or direct connection
    // Note: This requires direct database access or SQL editor
    
    return NextResponse.json({
      success: true,
      message: 'Please execute the SQL script manually in Supabase SQL Editor',
      sql,
      instructions: [
        '1. Go to Supabase Dashboard > SQL Editor',
        '2. Create a new query',
        '3. Copy and paste the SQL from the "sql" field above',
        '4. Click "Run"',
        '5. Refresh this page to verify'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if functions exist
    const { data: functions, error } = await supabase
      .rpc('get_functions_list')
      .catch(() => ({ data: null, error: null }))

    // Try to call the function to see if it exists
    const { error: testError } = await supabase.rpc('set_audit_user_context', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_user_email: 'test@test.com'
    })

    if (testError) {
      return NextResponse.json({
        success: false,
        functionsExist: false,
        error: testError,
        message: 'Wrapper functions do not exist in public schema. Please run POST /api/setup-audit-functions to get setup instructions.'
      })
    }

    return NextResponse.json({
      success: true,
      functionsExist: true,
      message: 'Audit wrapper functions are properly configured!'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
