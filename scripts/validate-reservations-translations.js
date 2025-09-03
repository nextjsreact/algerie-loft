#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the expected translation structure for reservations
const expectedStructure = {
  // Page level
  title: "string",
  subtitle: "string", 
  totalReservations: "string",
  monthlyRevenue: "string",
  occupancyRate: "string",
  guestSatisfaction: "string",
  quickActions: "string",
  recentActivity: "string",
  newReservation: "string",
  professionalTools: "string",
  availabilityManagement: "string",
  liveView: "string",
  manageGuests: "string",
  viewReports: "string",
  checkInCompleted: "string",
  reservationCancelled: "string",
  reservationsList: "string",
  advancedListView: "string",
  advancedListDescription: "string",
  reservationAnalytics: "string",
  enterpriseAnalyticsSuite: "string",
  enterpriseAnalyticsDescription: "string",
  
  // Calendar
  calendar: {
    title: "string",
    month: "string",
    week: "string",
    day: "string",
    agenda: "string",
    event: "string",
    noEventsInRange: "string",
    allDay: "string",
    work_week: "string",
    yesterday: "string",
    tomorrow: "string",
    showMore: "string"
  },
  
  // Status
  status: {
    confirmed: "string",
    pending: "string",
    cancelled: "string",
    completed: "string"
  },
  
  // Availability
  availability: {
    management: "string",
    blockDates: "string",
    chooseLoft: "string",
    endDate: "string",
    maintenance: "string",
    minimumStay: "string",
    other: "string",
    personalUse: "string",
    priceOverride: "string",
    priceOverridePlaceholder: "string",
    reasonForBlocking: "string",
    renovation: "string",
    selectLoft: "string",
    selectReason: "string",
    startDate: "string",
    unblockDates: "string"
  },
  
  // Upcoming
  upcoming: {
    title: "string",
    empty: "string"
  },
  
  // Nights
  nights: "string",
  
  // Form
  form: {
    title: "string",
    loft: "string",
    selectLoft: "string",
    guestCount: "string",
    guest: "string",
    guests: "string",
    checkIn: "string",
    checkOut: "string",
    guestInfo: "string",
    guestName: "string",
    guestEmail: "string",
    guestPhone: "string",
    guestNationality: "string",
    specialRequests: "string",
    specialRequestsPlaceholder: "string",
    checkingAvailability: "string",
    notAvailable: "string",
    available: "string",
    basePrice: "string",
    cleaningFee: "string",
    serviceFee: "string",
    taxes: "string",
    total: "string",
    creating: "string",
    createReservation: "string",
    errorCreating: "string",
    successCreated: "string",
    successDescription: "string",
    propertyGuestDetails: "string",
    stayDates: "string",
    pricingBreakdown: "string",
    availabilityPerfect: "string",
    professional: "string"
  }
};

// Languages to check
const languages = ['ar', 'en', 'fr'];

function loadTranslations(language) {
  const filePath = path.join(__dirname, `../public/locales/${language}/reservations.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${language} translations:`, error.message);
    return null;
  }
}

function checkMissingKeys(obj, expected, currentPath = '') {
  const missing = [];
  
  for (const key in expected) {
    const currentPathWithKey = currentPath ? `${currentPath}.${key}` : key;
    
    if (!(key in obj)) {
      missing.push(currentPathWithKey);
    } else if (typeof expected[key] === 'object' && expected[key] !== null) {
      // It's a nested object
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        missing.push(currentPathWithKey);
      } else {
        missing.push(...checkMissingKeys(obj[key], expected[key], currentPathWithKey));
      }
    }
  }
  
  return missing;
}

function checkEmptyValues(obj, currentPath = '') {
  const empty = [];
  
  for (const key in obj) {
    const currentPathWithKey = currentPath ? `${currentPath}.${key}` : key;
    
    if (typeof obj[key] === 'string' && obj[key].trim() === '') {
      empty.push(currentPathWithKey);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      empty.push(...checkEmptyValues(obj[key], currentPathWithKey));
    }
  }
  
  return empty;
}

function validateReservationsTranslations() {
  console.log('🔍 Validating reservations translations...\n');
  
  let allValid = true;
  const results = {};
  
  for (const language of languages) {
    console.log(`📝 Checking ${language.toUpperCase()} translations...`);
    
    const translations = loadTranslations(language);
    if (!translations) {
      allValid = false;
      results[language] = { valid: false, error: 'Could not load translations' };
      continue;
    }
    
    // Check for missing keys
    const missingKeys = checkMissingKeys(translations, expectedStructure);
    
    // Check for empty values
    const emptyValues = checkEmptyValues(translations);
    
    const isValid = missingKeys.length === 0 && emptyValues.length === 0;
    allValid = allValid && isValid;
    
    results[language] = {
      valid: isValid,
      missingKeys,
      emptyValues,
      totalKeys: Object.keys(expectedStructure).length
    };
    
    if (missingKeys.length > 0) {
      console.log(`  ❌ Missing ${missingKeys.length} keys:`);
      missingKeys.slice(0, 5).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (missingKeys.length > 5) {
        console.log(`    ... and ${missingKeys.length - 5} more`);
      }
    }
    
    if (emptyValues.length > 0) {
      console.log(`  ⚠️  Empty values for ${emptyValues.length} keys:`);
      emptyValues.slice(0, 5).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (emptyValues.length > 5) {
        console.log(`    ... and ${emptyValues.length - 5} more`);
      }
    }
    
    if (isValid) {
      console.log(`  ✅ All ${Object.keys(expectedStructure).length} translation keys are present and valid`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  
  for (const [language, result] of Object.entries(results)) {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${language.toUpperCase()}: ${result.valid ? 'Valid' : 'Invalid'}`);
    
    if (!result.valid) {
      if (result.missingKeys && result.missingKeys.length > 0) {
        console.log(`   Missing: ${result.missingKeys.length} keys`);
      }
      if (result.emptyValues && result.emptyValues.length > 0) {
        console.log(`   Empty: ${result.emptyValues.length} values`);
      }
    }
  }
  
  console.log('='.repeat(50));
  console.log(`Overall: ${allValid ? '✅ All translations are valid' : '❌ Some translations need fixes'}`);
  
  if (!allValid) {
    console.log('\n🛠️  Recommended actions:');
    console.log('1. Add missing translation keys to all language files');
    console.log('2. Fill empty translation values');
    console.log('3. Run validation again to confirm fixes');
    console.log('4. Test the translations in the application');
  }
  
  return allValid;
}

// Run validation
if (require.main === module) {
  validateReservationsTranslations();
}

module.exports = { validateReservationsTranslations, expectedStructure };