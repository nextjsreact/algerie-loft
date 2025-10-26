import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'
import { emailNotificationService } from '@/lib/services/email-notification-service'

// POST /api/admin/email-templates/test - Test email template
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
      .select('role, email')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      template_key,
      test_variables = {},
      test_email
    } = body

    if (!template_key) {
      return NextResponse.json(
        { error: 'Template key is required' },
        { status: 400 }
      )
    }

    // Get the email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', template_key)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    // Use default test variables if none provided
    const defaultVariables = {
      client_name: 'John Doe',
      partner_name: 'Jane Smith',
      loft_name: 'Beautiful Downtown Loft',
      loft_address: '123 Main Street, Algiers',
      check_in_date: 'March 15, 2024',
      check_out_date: 'March 18, 2024',
      guest_count: '2',
      total_price: '15000.00',
      currency: 'DZD',
      booking_reference: 'BK-2024-001',
      check_in_time: '15:00',
      check_in_instructions: 'Please contact the host upon arrival.',
      partner_contact: '+213 555 123 456',
      booking_link: `${process.env.NEXT_PUBLIC_APP_URL}/partner/bookings/test-booking-id`,
      cancellation_date: 'March 10, 2024',
      cancellation_reason: 'Change of plans',
      refund_details: 'Full refund will be processed within 5-7 business days.'
    }

    const variables = { ...defaultVariables, ...test_variables }

    // Process the template
    const processTemplate = (template: string, vars: Record<string, any>) => {
      let processed = template
      Object.entries(vars).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        processed = processed.replace(new RegExp(placeholder, 'g'), String(value))
      })
      return processed
    }

    const subject = processTemplate(template.subject_template, variables)
    const body_content = processTemplate(template.body_template, variables)

    // Send test email
    const testEmailAddress = test_email || profile.email
    
    try {
      const emailSent = await emailNotificationService.sendEmailNotification({
        to: testEmailAddress,
        template_key,
        variables,
        user_id: session.user.id
      })

      return NextResponse.json({
        success: true,
        template: {
          subject,
          body: body_content,
          sent_to: testEmailAddress,
          email_sent: emailSent
        },
        message: emailSent 
          ? `Test email sent successfully to ${testEmailAddress}`
          : `Template processed successfully (email sending disabled in test mode)`
      })

    } catch (emailError) {
      console.error('Error sending test email:', emailError)
      
      // Return the processed template even if email sending fails
      return NextResponse.json({
        success: true,
        template: {
          subject,
          body: body_content,
          sent_to: testEmailAddress,
          email_sent: false
        },
        message: 'Template processed successfully, but email sending failed',
        error: 'Email sending failed'
      })
    }

  } catch (error) {
    console.error('Unexpected error testing email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}