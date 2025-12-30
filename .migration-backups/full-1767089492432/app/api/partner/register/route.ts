import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { PartnerRegistrationRequest, PartnerRegistrationResponse } from '@/types/partner'
import { z } from 'zod'

// Validation schema for partner registration
const partnerRegistrationSchema = z.object({
  personal_info: z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Please provide a valid phone number'),
    address: z.string().min(10, 'Please provide a complete address'),
  }),
  business_info: z.object({
    business_name: z.string().optional(),
    business_type: z.enum(['individual', 'company']),
    tax_id: z.string().optional(),
  }),
  portfolio_description: z.string().min(50, 'Please provide at least 50 characters describing your property portfolio'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = partnerRegistrationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('email', data.personal_info.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An account with this email already exists' 
        },
        { status: 409 }
      )
    }

    // Create user account with partner role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.personal_info.email,
      password: data.password,
      options: {
        data: {
          full_name: data.personal_info.full_name,
          role: 'partner',
        },
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: authError.message || 'Failed to create user account' 
        },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User creation failed' 
        },
        { status: 500 }
      )
    }

    // Create partner profile
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .insert({
        user_id: authData.user.id,
        business_name: data.business_info.business_name,
        business_type: data.business_info.business_type,
        tax_id: data.business_info.tax_id,
        address: data.personal_info.address,
        phone: data.personal_info.phone,
        portfolio_description: data.portfolio_description,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (partnerError) {
      console.error('Partner profile creation error:', partnerError)
      
      // Clean up the user account if partner profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create partner profile' 
        },
        { status: 500 }
      )
    }

    // Create partner validation request
    const { error: validationRequestError } = await supabase
      .from('partner_validation_requests')
      .insert({
        partner_id: partnerData.id,
        status: 'pending',
        submitted_data: {
          personal_info: data.personal_info,
          business_info: data.business_info,
          portfolio_description: data.portfolio_description
        },
        created_at: new Date().toISOString()
      })

    if (validationRequestError) {
      console.error('Validation request creation error:', validationRequestError)
      // Don't fail the registration for this, just log it
    }

    // Send notification email to admins
    try {
      const { EmailNotificationService } = await import('@/lib/services/email-notification-service')
      await EmailNotificationService.sendPartnerRegistrationNotification(
        partnerData,
        data.personal_info.email,
        data.personal_info.full_name
      )
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
      // Don't fail registration for email issues
    }

    // Send confirmation email to partner
    try {
      const { EmailNotificationService } = await import('@/lib/services/email-notification-service')
      await EmailNotificationService.sendPartnerConfirmationEmail(
        data.personal_info.email,
        data.personal_info.full_name
      )
    } catch (emailError) {
      console.error('Failed to send partner confirmation email:', emailError)
      // Don't fail registration for email issues
    }

    const response: PartnerRegistrationResponse = {
      success: true,
      message: 'Registration successful! Your application is pending approval.',
      partner_id: partnerData.id,
      validation_required: true
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Partner registration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred during registration' 
      },
      { status: 500 }
    )
  }
}

