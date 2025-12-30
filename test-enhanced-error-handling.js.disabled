/**
 * Test script for enhanced error handling in reservation API
 */

const testCases = [
  {
    name: 'Missing required fields',
    data: {
      invalid: 'data'
    },
    expectedStatus: 400,
    expectedErrorCode: 'VALIDATION_FAILED'
  },
  {
    name: 'Invalid loft ID format',
    data: {
      loft_id: 'invalid-id',
      check_in_date: '2024-12-25',
      check_out_date: '2024-12-27'
    },
    expectedStatus: 400,
    expectedErrorCode: 'VALIDATION_FAILED'
  },
  {
    name: 'Valid request structure',
    data: {
      loft_id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
      check_in_date: '2024-12-25',
      check_out_date: '2024-12-27',
      guest_info: {
        primary_guest: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '+213555000000'
        },
        total_guests: 2,
        adults: 2,
        children: 0,
        infants: 0
      },
      terms_accepted: true
    },
    expectedStatus: 201,
    expectedErrorCode: null
  }
];

async function testReservationAPI() {
  console.log('🧪 Testing Enhanced Error Handling in Reservation API\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      
      console.log(`  Status: ${response.status} (expected: ${testCase.expectedStatus})`);
      
      if (testCase.expectedErrorCode) {
        console.log(`  Error Code: ${result.code || 'N/A'} (expected: ${testCase.expectedErrorCode})`);
        console.log(`  Error Message: ${result.error || 'N/A'}`);
        
        if (result.suggestions) {
          console.log(`  Suggestions: ${result.suggestions.length} provided`);
        }
      } else {
        console.log(`  Success: ${result.success ? 'Yes' : 'No'}`);
        if (result.booking) {
          console.log(`  Reservation ID: ${result.booking.id}`);
          console.log(`  Confirmation Code: ${result.booking.confirmation_code}`);
        }
      }
      
      const statusMatch = response.status === testCase.expectedStatus;
      const errorCodeMatch = !testCase.expectedErrorCode || result.code === testCase.expectedErrorCode;
      
      console.log(`  ✅ Test ${statusMatch && errorCodeMatch ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.log(`  ❌ Test FAILED with error: ${error.message}\n`);
    }
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testReservationAPI().catch(console.error);
}

module.exports = { testReservationAPI, testCases };