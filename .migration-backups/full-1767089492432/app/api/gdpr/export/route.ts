import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { gdprService } from '@/lib/services/gdpr-compliance'
import { hasPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { user_id } = await request.json()
    
    // Users can export their own data, admins can export any user's data
    if (user_id !== session.user.id && !hasPermission(session.user.role, 'gdpr', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Export user data
    const exportData = await gdprService.exportUserData(user_id, session.user.id)
    
    // Create filename
    const filename = `gdpr_export_${user_id}_${new Date().toISOString().split('T')[0]}.json`
    
    // Return as downloadable file
    const response = new NextResponse(JSON.stringify(exportData, null, 2))
    response.headers.set('Content-Type', 'application/json')
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    
    return response

  } catch (error) {
    console.error('GDPR export error:', error)
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || session.user.id
    
    // Users can check their own export status, admins can check any user
    if (userId !== session.user.id && !hasPermission(session.user.role, 'gdpr', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get export history
    const { data, error } = await gdprService.supabase
      .from('gdpr_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'data_export')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw new Error(`Failed to fetch export history: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      exports: data || []
    })

  } catch (error) {
    console.error('GDPR export history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}