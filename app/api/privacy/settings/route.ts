import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PrivacyService } from '@/lib/services/privacy-service'
import { privacySettingsSchema } from '@/lib/schemas/privacy'
import { logger } from '@/lib/logger'

/**
 * GET /api/privacy/settings
 * Get privacy settings for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const settings = await PrivacyService.getPrivacySettings(user.id)

    return NextResponse.json({
      success: true,
      settings: settings?.settings || null
    })

  } catch (error) {
    logger.error('Get privacy settings API error', error)
    
    return NextResponse.json(
      { error: 'Failed to get privacy settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/privacy/settings
 * Update privacy settings for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate settings data
    const validatedSettings = privacySettingsSchema.parse(body)

    // Update privacy settings
    const result = await PrivacyService.updatePrivacySettings(user.id, validatedSettings)

    logger.info('Privacy settings updated via API', {
      userId: user.id,
      settingsId: result.id
    })

    return NextResponse.json({
      success: true,
      settings: result,
      message: 'Privacy settings updated successfully'
    })

  } catch (error) {
    logger.error('Update privacy settings API error', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    )
  }
}