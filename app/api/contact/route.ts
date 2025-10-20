import { NextRequest, NextResponse } from 'next/server'
import { contactFormSchema, type ContactFormData } from '@/lib/schemas/contact'
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
    const validatedData = contactFormSchema.parse(body)
    
    // Check honeypot field
    if (validatedData.website) {
      // Silently reject spam
      return NextResponse.json({ success: true, message: 'Form submitted successfully' })
    }

    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Store in database
    const supabase = createClient()
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        subject: validatedData.subject,
        message: validatedData.message,
        preferred_contact: validatedData.preferredContact,
        source: 'contact-form',
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        status: 'new',
        metadata: {
          consent_to_contact: validatedData.consentToContact,
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save submission')
    }

    // Send email notification to admin
    try {
      const transporter = createTransporter()
      
      const adminEmailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <p><strong>Preferred Contact:</strong> ${validatedData.preferredContact}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${validatedData.message.replace(/\n/g, '<br>')}
        </div>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${clientIP}</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `New Contact Form: ${validatedData.subject}`,
        html: adminEmailHtml,
        replyTo: validatedData.email
      })

      // Send confirmation email to user
      const userEmailHtml = `
        <h2>Thank you for contacting us!</h2>
        <p>Dear ${validatedData.name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Subject:</strong> ${validatedData.subject}<br>
          <strong>Message:</strong><br>
          ${validatedData.message.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>The Team</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: validatedData.email,
        subject: 'Thank you for your message',
        html: userEmailHtml
      })

    } catch (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid form data', errors: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}