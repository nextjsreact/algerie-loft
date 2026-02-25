import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClientWithAudit } from '@/utils/supabase/server-with-audit'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const loftId = searchParams.get('loftId')

    if (!loftId) {
      return NextResponse.json({
        success: false,
        error: 'loftId parameter required'
      })
    }

    const supabase = await createClient()
    
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        authError
      })
    }

    // Test 2: Get current loft data
    const { data: currentLoft, error: fetchError } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', loftId)
      .single()

    if (fetchError || !currentLoft) {
      return NextResponse.json({
        success: false,
        error: 'Loft not found',
        fetchError
      })
    }

    // Test 3: Try to update with audit context
    const supabaseWithAudit = await createClientWithAudit()
    
    // Make a small test update (update the same value to not change anything)
    const testUpdate = {
      price_per_night: currentLoft.price_per_night
    }

    const { data: updateData, error: updateError } = await supabaseWithAudit
      .from('lofts')
      .update(testUpdate)
      .eq('id', loftId)
      .select()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Update failed',
        updateError,
        currentLoft,
        testUpdate
      })
    }

    // Test 4: Check if audit log was created
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'lofts')
      .eq('record_id', loftId)
      .order('timestamp', { ascending: false })
      .limit(1)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      currentLoft: {
        id: currentLoft.id,
        name: currentLoft.name,
        price_per_night: currentLoft.price_per_night
      },
      updateSuccess: true,
      auditLogCreated: auditLogs && auditLogs.length > 0,
      latestAuditLog: auditLogs?.[0] || null,
      message: 'Test update successful!'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
