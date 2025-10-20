#!/usr/bin/env node

console.log('🔍 Testing Form Validation Logic...\n')

// Simple validation functions to test our form logic
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100
}

function validateMessage(message) {
  return typeof message === 'string' && message.trim().length >= 10 && message.trim().length <= 2000
}

function validateSubject(subject) {
  return typeof subject === 'string' && subject.trim().length >= 5 && subject.trim().length <= 200
}

function validatePhone(phone) {
  if (!phone) return true // Optional field
  return typeof phone === 'string' && phone.trim().length >= 10
}

function validateConsent(consent) {
  return consent === true
}

// Test cases
const testCases = [
  {
    name: 'Valid Email',
    test: () => validateEmail('john@example.com'),
    expected: true
  },
  {
    name: 'Invalid Email',
    test: () => validateEmail('invalid-email'),
    expected: false
  },
  {
    name: 'Valid Name',
    test: () => validateName('John Doe'),
    expected: true
  },
  {
    name: 'Name Too Short',
    test: () => validateName('J'),
    expected: false
  },
  {
    name: 'Valid Message',
    test: () => validateMessage('This is a valid message with enough characters'),
    expected: true
  },
  {
    name: 'Message Too Short',
    test: () => validateMessage('Short'),
    expected: false
  },
  {
    name: 'Valid Subject',
    test: () => validateSubject('Valid subject'),
    expected: true
  },
  {
    name: 'Subject Too Short',
    test: () => validateSubject('Hi'),
    expected: false
  },
  {
    name: 'Valid Phone',
    test: () => validatePhone('+1234567890'),
    expected: true
  },
  {
    name: 'Optional Phone (empty)',
    test: () => validatePhone(''),
    expected: true
  },
  {
    name: 'Invalid Phone',
    test: () => validatePhone('123'),
    expected: false
  },
  {
    name: 'Valid Consent',
    test: () => validateConsent(true),
    expected: true
  },
  {
    name: 'Invalid Consent',
    test: () => validateConsent(false),
    expected: false
  }
]

let passed = 0
let failed = 0

console.log('Running validation tests...\n')

testCases.forEach((testCase, index) => {
  try {
    const result = testCase.test()
    
    if (result === testCase.expected) {
      console.log(`✅ ${index + 1}. ${testCase.name} - PASSED`)
      passed++
    } else {
      console.log(`❌ ${index + 1}. ${testCase.name} - FAILED (expected ${testCase.expected}, got ${result})`)
      failed++
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${testCase.name} - ERROR: ${error.message}`)
    failed++
  }
})

// Test complete form validation
console.log('\n📋 Testing Complete Form Validation...\n')

function validateContactForm(data) {
  const errors = []
  
  if (!validateName(data.name)) {
    errors.push('Name must be between 2 and 100 characters')
  }
  
  if (!validateEmail(data.email)) {
    errors.push('Please enter a valid email address')
  }
  
  if (!validatePhone(data.phone)) {
    errors.push('Phone number must be at least 10 characters if provided')
  }
  
  if (!validateSubject(data.subject)) {
    errors.push('Subject must be between 5 and 200 characters')
  }
  
  if (!validateMessage(data.message)) {
    errors.push('Message must be between 10 and 2000 characters')
  }
  
  if (!validateConsent(data.consentToContact)) {
    errors.push('You must consent to being contacted')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Test valid form data
const validFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  subject: 'Test inquiry',
  message: 'This is a test message for the contact form validation',
  preferredContact: 'email',
  consentToContact: true,
  website: ''
}

const validResult = validateContactForm(validFormData)
if (validResult.isValid) {
  console.log('✅ Valid form data - PASSED')
  passed++
} else {
  console.log('❌ Valid form data - FAILED')
  console.log('   Errors:', validResult.errors)
  failed++
}

// Test invalid form data
const invalidFormData = {
  name: 'J',
  email: 'invalid-email',
  phone: '123',
  subject: 'Hi',
  message: 'Short',
  preferredContact: 'email',
  consentToContact: false,
  website: ''
}

const invalidResult = validateContactForm(invalidFormData)
if (!invalidResult.isValid && invalidResult.errors.length > 0) {
  console.log('✅ Invalid form data correctly rejected - PASSED')
  console.log('   Expected errors found:', invalidResult.errors.length)
  passed++
} else {
  console.log('❌ Invalid form data should have been rejected - FAILED')
  failed++
}

// Test honeypot detection
console.log('\n🍯 Testing Honeypot Spam Detection...\n')

function detectSpam(data) {
  // Check honeypot field
  if (data.website && data.website.trim() !== '') {
    return true
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /viagra/i,
    /casino/i,
    /lottery/i,
    /winner/i,
    /congratulations/i,
    /click here/i
  ]
  
  const textToCheck = `${data.name} ${data.subject} ${data.message}`.toLowerCase()
  return suspiciousPatterns.some(pattern => pattern.test(textToCheck))
}

const cleanData = { ...validFormData, website: '' }
const spamData = { ...validFormData, website: 'http://spam-site.com' }
const suspiciousData = { ...validFormData, message: 'Click here to win the lottery!' }

if (!detectSpam(cleanData)) {
  console.log('✅ Clean data not flagged as spam - PASSED')
  passed++
} else {
  console.log('❌ Clean data incorrectly flagged as spam - FAILED')
  failed++
}

if (detectSpam(spamData)) {
  console.log('✅ Honeypot spam correctly detected - PASSED')
  passed++
} else {
  console.log('❌ Honeypot spam not detected - FAILED')
  failed++
}

if (detectSpam(suspiciousData)) {
  console.log('✅ Suspicious content correctly detected - PASSED')
  passed++
} else {
  console.log('❌ Suspicious content not detected - FAILED')
  failed++
}

console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All form validation tests passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some validation tests failed.')
  process.exit(1)
}