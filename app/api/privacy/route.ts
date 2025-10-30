/**
 * GDPR Privacy Rights API
 * Handles privacy requests: access, erasure, portability, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  PrivacyRightsManager, 
  ConsentManager, 
  DataCategory, 
  LegalBasis 
} from '@/lib/security/gdpr-compliance';
import { DataExportService } from '@/lib/services/encrypted-user-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schemas
const privacyRequestSchema = z.object({
  type: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']),
  reason: z.string().optional(),
  details: z.any().optional()
});

const consentSchema = z.object({
  dataCategory: z.enum(['personal_identity', 'contact_information', 'financial_data', 'behavioral_data', 'technical_data', 'special_category']),
  purpose: z.string().min(10),
  consentGiven: z.boolean()
});

/**
 * Submit privacy request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    // Validate request
    const validation = privacyRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { type, reason, details } = validation.data;

    // Submit privacy request
    const requestId = await PrivacyRightsManager.submitRequest({
      userId: session.user.id,
      type,
      reason,
      details
    });

    logger.info('Privacy request submitted', { 
      userId: session.user.id, 
      type, 
      requestId 
    });

    return NextResponse.json({ 
      success: true, 
      requestId,
      message: `${type} request submitted successfully. You will be notified when it's processed.`
    });
  } catch (error) {
    logger.error('Privacy request submission failed', error);
    return NextResponse.json(
      { error: 'Failed to submit privacy request' },
      { status: 500 }
    );
  }
}

/**
 * Get user's privacy requests and data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'requests':
        // Get user's privacy requests
        const { createClient } = await import('@/utils/supabase/server');
        const supabase = await createClient();
        
        const { data: requests } = await supabase
          .from('gdpr_privacy_requests')
          .select('*')
          .eq('user_id', session.user.id)
          .order('request_date', { ascending: false });

        return NextResponse.json({ requests: requests || [] });

      case 'consents':
        // Get user's consent records
        const consents = await ConsentManager.getUserConsents(session.user.id);
        return NextResponse.json({ consents });

      case 'export':
        // Export all user data
        const userData = await DataExportService.exportUserData(session.user.id);
        
        // Create downloadable data package
        const exportData = {
          exportDate: new Date().toISOString(),
          userId: session.user.id,
          data: userData,
          format: 'JSON',
          version: '1.0'
        };

        return NextResponse.json(exportData, {
          headers: {
            'Content-Disposition': `attachment; filename="user-data-${session.user.id}-${new Date().toISOString().split('T')[0]}.json"`,
            'Content-Type': 'application/json'
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Privacy data retrieval failed', error);
    return NextResponse.json(
      { error: 'Failed to retrieve privacy data' },
      { status: 500 }
    );
  }
}

/**
 * Update consent preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    // Validate consent data
    const validation = consentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid consent data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { dataCategory, purpose, consentGiven } = validation.data;

    if (consentGiven) {
      // Record new consent
      await ConsentManager.recordConsent({
        userId: session.user.id,
        dataCategory: dataCategory as DataCategory,
        legalBasis: LegalBasis.CONSENT,
        purpose,
        consentGiven: true,
        version: '1.0',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    } else {
      // Withdraw consent
      await ConsentManager.withdrawConsent(
        session.user.id, 
        dataCategory as DataCategory
      );
    }

    logger.info('Consent updated', { 
      userId: session.user.id, 
      dataCategory, 
      consentGiven 
    });

    return NextResponse.json({ 
      success: true,
      message: `Consent ${consentGiven ? 'granted' : 'withdrawn'} successfully`
    });
  } catch (error) {
    logger.error('Consent update failed', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

/**
 * Delete user account (Right to be Forgotten)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'User request';

    // Process erasure request
    await PrivacyRightsManager.processErasureRequest(session.user.id, reason);

    logger.info('User account deletion processed', { 
      userId: session.user.id, 
      reason 
    });

    return NextResponse.json({ 
      success: true,
      message: 'Your account and personal data have been successfully deleted'
    });
  } catch (error) {
    logger.error('Account deletion failed', error);
    
    if (error instanceof Error && error.message.includes('active reservations')) {
      return NextResponse.json(
        { error: 'Cannot delete account while you have active reservations. Please cancel or complete them first.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}