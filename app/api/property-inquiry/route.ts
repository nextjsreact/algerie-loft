import { NextRequest, NextResponse } from 'next/server'
import { propertyInquirySchema, type PropertyInquiryData } from '@/lib/schemas/contact'
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
    const validatedData = propertyInquirySchema.parse(body)
    
    // Check honeypot field
    if (validatedData.website) {
      // Silently reject spam
      return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' })
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
        subject: `Property Inquiry: ${validatedData.inquiryType}`,
        message: validatedData.message,
        preferred_contact: 'email', // Default for property inquiries
        source: 'property-inquiry',
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        status: 'new',
        metadata: {
          property_id: validatedData.propertyId,
          property_name: validatedData.propertyName,
          inquiry_type: validatedData.inquiryType,
          preferred_contact_time: validatedData.preferredContactTime,
          budget: validatedData.budget,
          move_in_date: validatedData.moveInDate,
          consent_to_contact: validatedData.consentToContact,
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save inquiry')
    }

    // Send email notification to admin
    try {
      const transporter = createTransporter()
      
      const inquiryTypeLabels = {
        viewing: 'Property Viewing',
        information: 'Information Request',
        rental: 'Rental Inquiry',
        purchase: 'Purchase Inquiry',
        management: 'Management Services'
      }

      const adminEmailHtml = `
        <h2>New Property Inquiry</h2>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Property:</strong> ${validatedData.propertyName || validatedData.propertyId}</p>
        <p><strong>Inquiry Type:</strong> ${inquiryTypeLabels[validatedData.inquiryType]}</p>
        <hr>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
        <p><strong>Preferred Contact Time:</strong> ${validatedData.preferredContactTime || 'Anytime'}</p>
        ${validatedData.budget ? `<p><strong>Budget:</strong> ${validatedData.budget}</p>` : ''}
        ${validatedData.moveInDate ? `<p><strong>Move-in Date:</strong> ${validatedData.moveInDate}</p>` : ''}
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
        subject: `Property Inquiry: ${inquiryTypeLabels[validatedData.inquiryType]} - ${validatedData.propertyName || validatedData.propertyId}`,
        html: adminEmailHtml,
        replyTo: validatedData.email
      })

      // Send confirmation email to user
      const userEmailHtml = `
        <h2>Thank you for your property inquiry!</h2>
        <p>Dear ${validatedData.name},</p>
        <p>We have received your inquiry about ${validatedData.propertyName || 'the property'} and will get back to you within 24 hours.</p>
        <p><strong>Your inquiry details:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Property:</strong> ${validatedData.propertyName || validatedData.propertyId}<br>
          <strong>Inquiry Type:</strong> ${inquiryTypeLabels[validatedData.inquiryType]}<br>
          ${validatedData.budget ? `<strong>Budget:</strong> ${validatedData.budget}<br>` : ''}
          ${validatedData.moveInDate ? `<strong>Move-in Date:</strong> ${validatedData.moveInDate}<br>` : ''}
          <strong>Your Message:</strong><br>
          ${validatedData.message.replace(/\n/g, '<br>')}
        </div>
        <p>Our property specialists will review your inquiry and contact you soon with more information.</p>
        <p>Best regards,<br>The Property Team</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: validatedData.email,
        subject: `Property Inquiry Confirmation - ${validatedData.propertyName || 'Property'}`,
        html: userEmailHtml
      })

    } catch (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your property inquiry has been submitted successfully. We will contact you soon!',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Property inquiry error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid form data', errors: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your inquiry' },
      { status: 500 }
    )
  }
}