import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/admin/email-templates - Get all email templates (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or manager
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const template_type = searchParams.get('template_type')
    const is_active = searchParams.get('is_active')

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('template_name')

    if (template_type) {
      query = query.eq('template_type', template_type)
    }
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates || [] })

  } catch (error) {
    console.error('Unexpected error in email templates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/email-templates - Create new email template (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or manager
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      template_key,
      template_name,
      subject_template,
      body_template,
      template_type,
      variables,
      is_active = true
    } = body

    // Validate required fields
    if (!template_key || !template_name || !subject_template || !body_template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        template_key,
        template_name,
        subject_template,
        body_template,
        template_type: template_type || 'booking',
        variables: variables || [],
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error creating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}