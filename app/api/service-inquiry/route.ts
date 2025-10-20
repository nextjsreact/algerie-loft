import { NextRequest, NextResponse } from 'next/server'
import { serviceInquirySchema, type ServiceInquiryData } from '@/lib/schemas/contact'
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
    const validatedData = serviceInquirySchema.parse(body)
    
    // Check honeypot field
    if (validatedData.website) {
      // Silently reject spam
      return NextResponse.json({ success: true, message: 'Service inquiry submitted successfully' })
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
        subject: `Service Inquiry: ${validatedData.serviceType}`,
        message: validatedData.message,
        preferred_contact: 'email', // Default for service inquiries
        source: 'service-inquiry',
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        status: 'new',
        metadata: {
          service_type: validatedData.serviceType,
          property_type: validatedData.propertyType,
          property_count: validatedData.propertyCount,
          location: validatedData.location,
          current_situation: validatedData.currentSituation,
          timeline: validatedData.timeline,
          budget: validatedData.budget,
          consent_to_contact: validatedData.consentToContact,
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save service inquiry')
    }

    // Send email notification to admin
    try {
      const transporter = createTransporter()
      
      const serviceTypeLabels = {
        property_management: 'Property Management',
        rental_services: 'Rental Services',
        maintenance: 'Maintenance Services',
        consultation: 'Consultation',
        other: 'Other Services'
      }

      const propertyTypeLabels = {
        apartment: 'Apartment',
        house: 'House',
        commercial: 'Commercial',
        multiple: 'Multiple Properties',
        other: 'Other'
      }

      const situationLabels = {
        new_owner: 'New Property Owner',
        current_owner: 'Current Property Owner',
        looking_to_buy: 'Looking to Buy',
        property_manager: 'Property Manager',
        other: 'Other'
      }

      const timelineLabels = {
        immediate: 'Immediate',
        within_month: 'Within 1 Month',
        within_3months: 'Within 3 Months',
        within_6months: 'Within 6 Months',
        planning: 'Planning Phase'
      }

      const adminEmailHtml = `
        <h2>New Service Inquiry</h2>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Service Type:</strong> ${serviceTypeLabels[validatedData.serviceType]}</p>
        <hr>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
        ${validatedData.propertyType ? `<p><strong>Property Type:</strong> ${propertyTypeLabels[validatedData.propertyType]}</p>` : ''}
        ${validatedData.propertyCount ? `<p><strong>Number of Properties:</strong> ${validatedData.propertyCount}</p>` : ''}
        ${validatedData.location ? `<p><strong>Location:</strong> ${validatedData.location}</p>` : ''}
        ${validatedData.currentSituation ? `<p><strong>Current Situation:</strong> ${situationLabels[validatedData.currentSituation]}</p>` : ''}
        ${validatedData.timeline ? `<p><strong>Timeline:</strong> ${timelineLabels[validatedData.timeline]}</p>` : ''}
        ${validatedData.budget ? `<p><strong>Budget:</strong> ${validatedData.budget}</p>` : ''}
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
        subject: `Service Inquiry: ${serviceTypeLabels[validatedData.serviceType]} - ${validatedData.name}`,
        html: adminEmailHtml,
        replyTo: validatedData.email
      })

      // Send confirmation email to user
      const userEmailHtml = `
        <h2>Thank you for your service inquiry!</h2>
        <p>Dear ${validatedData.name},</p>
        <p>We have received your inquiry about our ${serviceTypeLabels[validatedData.serviceType].toLowerCase()} and will get back to you within 24 hours.</p>
        <p><strong>Your inquiry details:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Service:</strong> ${serviceTypeLabels[validatedData.serviceType]}<br>
          ${validatedData.propertyType ? `<strong>Property Type:</strong> ${propertyTypeLabels[validatedData.propertyType]}<br>` : ''}
          ${validatedData.propertyCount ? `<strong>Number of Properties:</strong> ${validatedData.propertyCount}<br>` : ''}
          ${validatedData.timeline ? `<strong>Timeline:</strong> ${timelineLabels[validatedData.timeline]}<br>` : ''}
          ${validatedData.budget ? `<strong>Budget:</strong> ${validatedData.budget}<br>` : ''}
          <strong>Your Message:</strong><br>
          ${validatedData.message.replace(/\n/g, '<br>')}
        </div>
        <p>Our service specialists will review your requirements and contact you soon with a customized proposal.</p>
        <p>Best regards,<br>The Services Team</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: validatedData.email,
        subject: `Service Inquiry Confirmation - ${serviceTypeLabels[validatedData.serviceType]}`,
        html: userEmailHtml
      })

    } catch (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your service inquiry has been submitted successfully. We will contact you soon!',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Service inquiry error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid form data', errors: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your service inquiry' },
      { status: 500 }
    )
  }
}