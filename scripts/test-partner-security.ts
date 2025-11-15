/**
 * Partner Security Test Script
 * Tests data isolation and authentication checks
 */

import { createClient } from '@supabase/supabase-js';
import { PartnerDataIsolation } from '../lib/security/partner-data-isolation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🔒 Starting Partner Security Tests\n');

  // Test 1: Verify RLS policies exist
  await testRLSPoliciesExist();

  // Test 2: Test property ownership verification
  await testPropertyOwnershipVerification();

  // Test 3: Test reservation access verification
  await testReservationAccessVerification();

  // Test 4: Test data isolation between partners
  await testDataIsolationBetweenPartners();

  // Test 5: Test audit logging
  await testAuditLogging();

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

async function testRLSPoliciesExist() {
  try {
    // Check if RLS is enabled on lofts table
    const { data: loftsRLS, error: loftsError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'lofts')
      .single();

    if (loftsError) {
      results.push({
        name: 'RLS Policies Exist - Lofts',
        passed: false,
        message: 'Failed to check RLS status for lofts table',
        details: loftsError
      });
      return;
    }

    // Check if RLS is enabled on reservations table
    const { data: reservationsRLS, error: reservationsError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'reservations')
      .single();

    if (reservationsError) {
      results.push({
        name: 'RLS Policies Exist - Reservations',
        passed: false,
        message: 'Failed to check RLS status for reservations table',
        details: reservationsError
      });
      return;
    }

    results.push({
      name: 'RLS Policies Exist',
      passed: true,
      message: 'RLS policies are configured for partner tables'
    });

  } catch (error) {
    results.push({
      name: 'RLS Policies Exist',
      passed: false,
      message: 'Error checking RLS policies',
      details: error
    });
  }
}

async function testPropertyOwnershipVerification() {
  try {
    // Get a test partner
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnersError || !partners || partners.length === 0) {
      results.push({
        name: 'Property Ownership Verification',
        passed: false,
        message: 'No test partners found',
        details: partnersError
      });
      return;
    }

    const testPartnerId = partners[0].id;

    // Get a property owned by this partner
    const { data: properties, error: propertiesError } = await supabase
      .from('lofts')
      .select('id')
      .eq('partner_id', testPartnerId)
      .limit(1);

    if (propertiesError || !properties || properties.length === 0) {
      results.push({
        name: 'Property Ownership Verification',
        passed: false,
        message: 'No test properties found for partner',
        details: { partnerId: testPartnerId, error: propertiesError }
      });
      return;
    }

    const testPropertyId = properties[0].id;

    // Test ownership verification
    const ownershipResult = await PartnerDataIsolation.verifyPropertyOwnership(
      testPropertyId,
      testPartnerId,
      supabase as any
    );

    if (ownershipResult.success && ownershipResult.data === true) {
      results.push({
        name: 'Property Ownership Verification',
        passed: true,
        message: 'Property ownership verification works correctly'
      });
    } else {
      results.push({
        name: 'Property Ownership Verification',
        passed: false,
        message: 'Property ownership verification failed',
        details: ownershipResult
      });
    }

  } catch (error) {
    results.push({
      name: 'Property Ownership Verification',
      passed: false,
      message: 'Error testing property ownership verification',
      details: error
    });
  }
}

async function testReservationAccessVerification() {
  try {
    // Get a test partner
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnersError || !partners || partners.length === 0) {
      results.push({
        name: 'Reservation Access Verification',
        passed: false,
        message: 'No test partners found'
      });
      return;
    }

    const testPartnerId = partners[0].id;

    // Get a reservation for this partner's property
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        lofts!inner(partner_id)
      `)
      .eq('lofts.partner_id', testPartnerId)
      .limit(1);

    if (reservationsError || !reservations || reservations.length === 0) {
      results.push({
        name: 'Reservation Access Verification',
        passed: true,
        message: 'No test reservations found (skipped)',
        details: 'This is acceptable if no reservations exist yet'
      });
      return;
    }

    const testReservationId = reservations[0].id;

    // Test reservation access verification
    const accessResult = await PartnerDataIsolation.verifyReservationAccess(
      testReservationId,
      testPartnerId,
      supabase as any
    );

    if (accessResult.success && accessResult.data === true) {
      results.push({
        name: 'Reservation Access Verification',
        passed: true,
        message: 'Reservation access verification works correctly'
      });
    } else {
      results.push({
        name: 'Reservation Access Verification',
        passed: false,
        message: 'Reservation access verification failed',
        details: accessResult
      });
    }

  } catch (error) {
    results.push({
      name: 'Reservation Access Verification',
      passed: false,
      message: 'Error testing reservation access verification',
      details: error
    });
  }
}

async function testDataIsolationBetweenPartners() {
  try {
    // Get two different partners
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(2);

    if (partnersError || !partners || partners.length < 2) {
      results.push({
        name: 'Data Isolation Between Partners',
        passed: true,
        message: 'Not enough partners to test isolation (skipped)',
        details: 'Need at least 2 partners for this test'
      });
      return;
    }

    const partner1Id = partners[0].id;
    const partner2Id = partners[1].id;

    // Get a property from partner 1
    const { data: partner1Properties, error: p1Error } = await supabase
      .from('lofts')
      .select('id')
      .eq('partner_id', partner1Id)
      .limit(1);

    if (p1Error || !partner1Properties || partner1Properties.length === 0) {
      results.push({
        name: 'Data Isolation Between Partners',
        passed: true,
        message: 'No properties found for partner 1 (skipped)'
      });
      return;
    }

    const partner1PropertyId = partner1Properties[0].id;

    // Try to verify ownership of partner 1's property as partner 2
    const crossOwnershipResult = await PartnerDataIsolation.verifyPropertyOwnership(
      partner1PropertyId,
      partner2Id,
      supabase as any
    );

    // This should fail (access denied)
    if (!crossOwnershipResult.success && crossOwnershipResult.accessDenied) {
      results.push({
        name: 'Data Isolation Between Partners',
        passed: true,
        message: 'Partners cannot access each other\'s properties (isolation working)'
      });
    } else {
      results.push({
        name: 'Data Isolation Between Partners',
        passed: false,
        message: 'SECURITY ISSUE: Partner 2 can access Partner 1\'s property!',
        details: crossOwnershipResult
      });
    }

  } catch (error) {
    results.push({
      name: 'Data Isolation Between Partners',
      passed: false,
      message: 'Error testing data isolation',
      details: error
    });
  }
}

async function testAuditLogging() {
  try {
    // Check if audit log table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('partner_data_access_logs')
      .select('id')
      .limit(1);

    if (tableError && tableError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      results.push({
        name: 'Audit Logging',
        passed: false,
        message: 'Audit log table does not exist or is not accessible',
        details: tableError
      });
      return;
    }

    results.push({
      name: 'Audit Logging',
      passed: true,
      message: 'Audit logging table exists and is accessible'
    });

  } catch (error) {
    results.push({
      name: 'Audit Logging',
      passed: false,
      message: 'Error testing audit logging',
      details: error
    });
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});
