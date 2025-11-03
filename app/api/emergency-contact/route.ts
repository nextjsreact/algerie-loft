import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

// Emergency contact schema
const emergencyContactSchema = z.object({
  type: z.enum(['maintenance', 'security', 'medical', 'access', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  guestName: z.string().min(2, 'Guest name is required'),
  guestPhone: z.string().min(10, 'Valid phone number is required'),
  bookingId: z.string().optional(),
  loftId: z.string().optional(),
  timestamp: z.string(),
  priority: z.enum(['urgent', 'high', 'normal']).default('urgent')
})

type EmergencyContactData = z.infer<typeof emergencyContactSchema>

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
    
    // Validate the emergency data
    const validatedData = emergencyContactSchema.parse(body)
    
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Store in database with high priority
    const supabase = await createClient()
    const { data: emergencySubmission, error: dbError } = await supabase
      .from('emergency_contacts')
      .insert({
        emergency_type: validatedData.type,
        description: validatedData.description,
        guest_name: validatedData.guestName,
        guest_phone: validatedData.guestPhone,
        booking_id: validatedData.bookingId || null,
        loft_id: validatedData.loftId || null,
        priority: validatedData.priority,
        status: 'new',
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        metadata: {
          submitted_at: validatedData.timestamp,
          source: 'emergency-contact-form'
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save emergency submission')
    }

    // Send immediate emergency notification emails
    try {
      const transporter = createTransporter()
      
      // Emergency notification to admin/support team
      const emergencyEmailHtml = `
        <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 10px 0;">
          <h1 style="color: #dc2626; margin: 0 0 15px 0;">🚨 URGENCE - CONTACT IMMÉDIAT REQUIS</h1>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h2 style="color: #dc2626; margin: 0 0 10px 0;">Détails de l'urgence</h2>
            <p><strong>ID Urgence:</strong> ${emergencySubmission.id}</p>
            <p><strong>Type:</strong> ${validatedData.type.toUpperCase()}</p>
            <p><strong>Priorité:</strong> ${validatedData.priority.toUpperCase()}</p>
            <p><strong>Heure:</strong> ${new Date(validatedData.timestamp).toLocaleString('fr-FR')}</p>
          </div>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">Informations du client</h3>
            <p><strong>Nom:</strong> ${validatedData.guestName}</p>
            <p><strong>Téléphone:</strong> ${validatedData.guestPhone}</p>
            ${validatedData.bookingId ? `<p><strong>Réservation:</strong> ${validatedData.bookingId}</p>` : ''}
            ${validatedData.loftId ? `<p><strong>Loft:</strong> ${validatedData.loftId}</p>` : ''}
          </div>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">Description de l'urgence</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${validatedData.description.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">⚡ ACTION IMMÉDIATE REQUISE</h3>
            <p style="color: #92400e; margin: 0;">
              Contactez immédiatement le client au <strong>${validatedData.guestPhone}</strong>
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            IP: ${clientIP} | Soumis: ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `

      // Send to emergency contact list
      const emergencyEmails = [
        process.env.EMERGENCY_EMAIL || process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        process.env.MANAGER_EMAIL, // Add manager email if available
        process.env.SUPPORT_EMAIL  // Add support team email if available
      ].filter(Boolean) // Remove undefined emails

      // Send to all emergency contacts
      for (const email of emergencyEmails) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `🚨 URGENCE - ${validatedData.type.toUpperCase()} - ${validatedData.guestName}`,
          html: emergencyEmailHtml,
          priority: 'high',
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high'
          }
        })
      }

      // Send confirmation to guest
      const guestConfirmationHtml = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #dc2626;">Votre demande d'urgence a été reçue</h2>
          <p>Bonjour ${validatedData.guestName},</p>
          
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0;">
            <p><strong>Votre demande d'urgence a été transmise à notre équipe.</strong></p>
            <p>Numéro de référence: <strong>${emergencySubmission.id}</strong></p>
            <p>Nous vous contacterons dans les plus brefs délais au ${validatedData.guestPhone}</p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Résumé de votre demande:</h3>
            <p><strong>Type:</strong> ${validatedData.type}</p>
            <p><strong>Description:</strong> ${validatedData.description}</p>
            <p><strong>Heure:</strong> ${new Date(validatedData.timestamp).toLocaleString('fr-FR')}</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>En cas d'urgence vitale:</strong></p>
            <p>• Urgence médicale: 15 (SAMU)</p>
            <p>• Police: 17</p>
            <p>• Pompiers: 18</p>
          </div>

          <p>Cordialement,<br>L'équipe d'urgence</p>
        </div>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: validatedData.guestPhone.includes('@') ? validatedData.guestPhone : undefined, // Only if email provided
        subject: 'Confirmation - Demande d\'urgence reçue',
        html: guestConfirmationHtml
      })

    } catch (emailError) {
      console.error('Emergency email error:', emailError)
      // Don't fail the request if email fails - emergency is logged in DB
    }

    // Send SMS notification if SMS service is configured
    try {
      if (process.env.SMS_API_KEY && process.env.SMS_SENDER) {
        const smsMessage = `URGENCE LOFT ALGERIE - ${validatedData.type.toUpperCase()}
Client: ${validatedData.guestName}
Tel: ${validatedData.guestPhone}
${validatedData.bookingId ? `Réservation: ${validatedData.bookingId}` : ''}
CONTACTEZ IMMÉDIATEMENT`

        // This would integrate with your SMS provider (Twilio, etc.)
        // await sendSMS(process.env.EMERGENCY_PHONE, smsMessage)
      }
    } catch (smsError) {
      console.error('SMS notification error:', smsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Emergency request submitted successfully. You will be contacted immediately.',
      emergencyId: emergencySubmission.id,
      priority: validatedData.priority
    })

  } catch (error) {
    console.error('Emergency contact error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid emergency data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to process emergency request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check emergency status (for admin/support)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emergencyId = searchParams.get('id')
    
    if (!emergencyId) {
      return NextResponse.json(
        { success: false, message: 'Emergency ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: emergency, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('id', emergencyId)
      .single()

    if (error || !emergency) {
      return NextResponse.json(
        { success: false, message: 'Emergency not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      emergency: {
        id: emergency.id,
        type: emergency.emergency_type,
        status: emergency.status,
        priority: emergency.priority,
        guestName: emergency.guest_name,
        guestPhone: emergency.guest_phone,
        description: emergency.description,
        createdAt: emergency.created_at
      }
    })

  } catch (error) {
    console.error('Emergency status check error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check emergency status' },
      { status: 500 }
    )
  }
}