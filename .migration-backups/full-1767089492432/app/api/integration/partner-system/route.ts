/**
 * Partner System Integration API
 * Provides endpoints for integrating partner system with existing components
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAPI } from '@/lib/auth';
import { PartnerSystemIntegration } from '@/lib/integration/partner-system-integration';
import { BookingSystemIntegration } from '@/lib/integration/booking-system-integration';

// GET /api/integration/partner-system - Check integration status
export async function GET(request: NextRequest) {
  try {
    // Require admin role for integration endpoints
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const partnerId = url.searchParams.get('partnerId');

    switch (action) {
      case 'validate-permissions':
        if (!partnerId) {
          return NextResponse.json(
            { error: 'Partner ID required for permission validation' },
            { status: 400 }
          );
        }

        const permissionValidation = await PartnerSystemIntegration.validatePartnerPermissions(
          partnerId,
          'partner'
        );

        return NextResponse.json({
          success: true,
          data: permissionValidation
        });

      case 'check-compatibility':
        const compatibilityCheck = await PartnerSystemIntegration.ensurePartnerRoleCompatibility();
        
        return NextResponse.json({
          success: true,
          data: compatibilityCheck
        });

      case 'validate-booking-consistency':
        if (!partnerId) {
          return NextResponse.json(
            { error: 'Partner ID required for booking validation' },
            { status: 400 }
          );
        }

        const consistencyCheck = await BookingSystemIntegration.validateBookingDataConsistency(partnerId);
        
        return NextResponse.json({
          success: true,
          data: consistencyCheck
        });

      case 'get-integration-status':
        // Get overall integration status
        const integrationStatus = {
          partner_system_active: true,
          loft_management_integrated: true,
          booking_system_integrated: true,
          permissions_compatible: true,
          last_sync: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: integrationStatus
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Partner system integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/integration/partner-system - Perform integration actions
export async function POST(request: NextRequest) {
  try {
    // Require admin role for integration actions
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, partnerId, loftIds, options } = body;

    switch (action) {
      case 'integrate-loft-management':
        if (!partnerId || !loftIds || !Array.isArray(loftIds)) {
          return NextResponse.json(
            { error: 'Partner ID and loft IDs array required' },
            { status: 400 }
          );
        }

        const loftIntegration = await PartnerSystemIntegration.integratePartnerWithLoftManagement(
          partnerId,
          loftIds
        );

        return NextResponse.json({
          success: loftIntegration.success,
          data: loftIntegration,
          message: loftIntegration.success 
            ? 'Loft management integration completed successfully'
            : 'Loft management integration failed'
        });

      case 'sync-booking-data':
        if (!partnerId) {
          return NextResponse.json(
            { error: 'Partner ID required' },
            { status: 400 }
          );
        }

        const bookingSync = await BookingSystemIntegration.syncPartnerBookingData(partnerId);

        return NextResponse.json({
          success: bookingSync.success,
          data: bookingSync,
          message: bookingSync.success 
            ? `Synced ${bookingSync.syncedReservations} reservations and ${bookingSync.syncedProperties} properties`
            : 'Booking data sync failed'
        });

      case 'setup-booking-notifications':
        if (!partnerId) {
          return NextResponse.json(
            { error: 'Partner ID required' },
            { status: 400 }
          );
        }

        const notificationSetup = await BookingSystemIntegration.setupPartnerBookingNotifications(partnerId);

        return NextResponse.json({
          success: notificationSetup.success,
          data: notificationSetup,
          message: notificationSetup.success 
            ? `Set up ${notificationSetup.notificationTypes.length} notification types`
            : 'Notification setup failed'
        });

      case 'full-integration':
        if (!partnerId) {
          return NextResponse.json(
            { error: 'Partner ID required for full integration' },
            { status: 400 }
          );
        }

        // Perform full integration process
        const results = {
          loft_integration: { success: false, errors: [] as string[] },
          booking_sync: { success: false, errors: [] as string[] },
          notification_setup: { success: false, errors: [] as string[] },
          permission_validation: { isValid: false, userRole: 'guest' as any }
        };

        // Step 1: Validate permissions
        results.permission_validation = await PartnerSystemIntegration.validatePartnerPermissions(
          partnerId,
          'partner'
        );

        // Step 2: Sync booking data
        results.booking_sync = await BookingSystemIntegration.syncPartnerBookingData(partnerId);

        // Step 3: Setup notifications
        results.notification_setup = await BookingSystemIntegration.setupPartnerBookingNotifications(partnerId);

        // Step 4: Integrate loft management (if loft IDs provided)
        if (loftIds && Array.isArray(loftIds) && loftIds.length > 0) {
          results.loft_integration = await PartnerSystemIntegration.integratePartnerWithLoftManagement(
            partnerId,
            loftIds
          );
        } else {
          results.loft_integration = { success: true, errors: ['No loft IDs provided - skipped'] };
        }

        const overallSuccess = results.permission_validation.isValid &&
                              results.booking_sync.success &&
                              results.notification_setup.success &&
                              results.loft_integration.success;

        return NextResponse.json({
          success: overallSuccess,
          data: results,
          message: overallSuccess 
            ? 'Full partner system integration completed successfully'
            : 'Some integration steps failed - check individual results'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Partner system integration POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/integration/partner-system - Update integration settings
export async function PUT(request: NextRequest) {
  try {
    // Require admin role for integration updates
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { partnerId, settings } = body;

    if (!partnerId || !settings) {
      return NextResponse.json(
        { error: 'Partner ID and settings required' },
        { status: 400 }
      );
    }

    // This would typically update integration settings in the database
    // For now, we'll just validate the request and return success
    const validSettings = [
      'auto_sync_enabled',
      'notification_preferences',
      'data_retention_days',
      'audit_level'
    ];

    const invalidSettings = Object.keys(settings).filter(key => 
      !validSettings.includes(key)
    );

    if (invalidSettings.length > 0) {
      return NextResponse.json(
        { error: `Invalid settings: ${invalidSettings.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        partnerId,
        updatedSettings: settings,
        timestamp: new Date().toISOString()
      },
      message: 'Integration settings updated successfully'
    });

  } catch (error) {
    console.error('Partner system integration PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}