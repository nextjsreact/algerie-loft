import { NextRequest, NextResponse } from 'next/server'
import { callbackRequestSchema, type CallbackRequestData } from '@/lib/schemas/contact'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the form data
    const validatedData = callbackRequestSchema.parse(body)
    
    // Check honeypot field
    if (validatedData.website) {
      // Silently reject spam
      return NextResponse.json({ success: true, message: 'Callback request submitted successfully' })
    }

    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Store in database
    const supabase = await createClient()
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: validatedData.name,
        email: '', // Not required for callback requests
        phone: validatedData.phone,
        subject: `Callback Request: ${validatedData.topic || 'General'}`,
        message: `Callback request for ${validatedData.preferredTime}. Topic: ${validatedData.topic || 'General inquiry'}`,
        preferred_contact: 'phone',
        source: 'callback-request',
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        status: 'new',
        metadata: {
          preferred_time: validatedData.preferredTime,
          topic: validatedData.topic,
          consent_to_contact: validatedData.consentToContact,
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save callback request')
    }

    // Send email notification to admin
    try {
      const transporter = createTransporter()
      
      const timeLabels = {
        morning: 'Morning (9 AM - 12 PM)',
        afternoon: 'Afternoon (12 PM - 6 PM)',
        evening: 'Evening (6 PM - 9 PM)'
      }

      const topicLabels = {
        property_management: 'Property Management',
        rental_inquiry: 'Rental Inquiry',
        general_inquiry: 'General Inquiry',
        other: 'Other'
      }

      const adminEmailHtml = `
        <h2>New Callback Request</h2>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>URGENT:</strong> Customer requesting callback</p>
        <hr>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Phone:</strong> ${validatedData.phone}</p>
        <p><strong>Preferred Time:</strong> ${timeLabels[validatedData.preferredTime]}</p>
        ${validatedData.topic ? `<p><strong>Topic:</strong> ${topicLabels[validatedData.topic]}</p>` : ''}
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${clientIP}</p>
        <hr>
        <p style="color: #d97706; font-weight: bold;">⚠️ This is a callback request - customer expects a phone call!</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `🔔 CALLBACK REQUEST - ${validatedData.name} - ${validatedData.phone}`,
        html: adminEmailHtml,
        priority: 'high'
      })

    } catch (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your callback request has been submitted successfully. We will call you soon!',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Callback request error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid form data', errors: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your callback request' },
      { status: 500 }
    )
  }
}