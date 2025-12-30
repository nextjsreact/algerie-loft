// Test script for booking API
// Run this in the browser console to test the API

async function testBookingAPI() {
  console.log('🧪 Testing Booking API...');
  
  try {
    // Test 1: Get all reservations
    console.log('\n📋 Test 1: Get all reservations');
    const allReservationsResponse = await fetch('/api/bookings');
    const allReservationsData = await allReservationsResponse.json();
    console.log('✅ All reservations:', allReservationsData);
    
    // Test 2: Get specific reservation by ID
    console.log('\n🔍 Test 2: Get reservation by ID');
    const reservationId = 'res_1761750802743_fk2abpr8b';
    const reservationResponse = await fetch(`/api/bookings/${reservationId}`);
    const reservationData = await reservationResponse.json();
    console.log('✅ Reservation details:', reservationData);
    
    // Test 3: Get reservation by confirmation code
    console.log('\n🎫 Test 3: Get reservation by confirmation code');
    const confirmationCode = 'AL8K9M2P';
    const confirmationResponse = await fetch(`/api/bookings/${confirmationCode}`);
    const confirmationData = await confirmationResponse.json();
    console.log('✅ Reservation by confirmation code:', confirmationData);
    
    // Test 4: Get reservation by booking reference
    console.log('\n📄 Test 4: Get reservation by booking reference');
    const bookingReference = 'LA25001234';
    const referenceResponse = await fetch(`/api/bookings/${bookingReference}`);
    const referenceData = await referenceResponse.json();
    console.log('✅ Reservation by booking reference:', referenceData);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBookingAPI();