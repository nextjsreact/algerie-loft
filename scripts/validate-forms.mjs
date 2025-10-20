#!/usr/bin/env node

import { contactFormSchema, propertyInquirySchema, serviceInquirySchema, callbackRequestSchema } from '../lib/schemas/contact.ts'

console.log('🔍 Validating Form Schemas...\n')

// Test data
const testCases = [
  {
    name: 'Contact Form - Valid Data',
    schema: contactFormSchema,
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      subject: 'Test inquiry',
      message: 'This is a test message for validation',
      preferredContact: 'email',
      consentToContact: true,
      website: ''
    },
    shouldPass: true
  },
  {
    name: 'Contact Form - Invalid Email',
    schema: contactFormSchema,
    data: {
      name: 'John Doe',
      email: 'invalid-email',
      subject: 'Test inquiry',
      message: 'This is a test message for validation',
      preferredContact: 'email',
      consentToContact: true,
      website: ''
    },
    shouldPass: false
  },
  {
    name: 'Contact Form - Missing Consent',
    schema: contactFormSchema,
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test inquiry',
      message: 'This is a test message for validation',
      preferredContact: 'email',
      consentToContact: false,
      website: ''
    },
    shouldPass: false
  },
  {
    name: 'Property Inquiry - Valid Data',
    schema: propertyInquirySchema,
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1987654321',
      propertyId: 'prop-123',
      propertyName: 'Test Property',
      inquiryType: 'viewing',
      message: 'I would like to schedule a viewing',
      preferredContactTime: 'morning',
      budget: '$1500-2000',
      moveInDate: '2024-06-01',
      consentToContact: true,
      website: ''
    },
    shouldPass: true
  },
  {
    name: 'Service Inquiry - Valid Data',
    schema: serviceInquirySchema,
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1555987654',
      serviceType: 'property_management',
      propertyType: 'apartment',
      propertyCount: 2,
      location: 'Downtown',
      currentSituation: 'new_owner',
      timeline: 'within_month',
      message: 'I need property management services',
      budget: '$800-1200/month',
      consentToContact: true,
      website: ''
    },
    shouldPass: true
  },
  {
    name: 'Callback Request - Valid Data',
    schema: callbackRequestSchema,
    data: {
      name: 'Alice Brown',
      phone: '+1555123456',
      preferredTime: 'afternoon',
      topic: 'general_inquiry',
      consentToContact: true,
      website: ''
    },
    shouldPass: true
  },
  {
    name: 'Callback Request - Invalid Phone',
    schema: callbackRequestSchema,
    data: {
      name: 'Alice Brown',
      phone: '123', // Too short
      preferredTime: 'afternoon',
      consentToContact: true,
      website: ''
    },
    shouldPass: false
  }
]

let passed = 0
let failed = 0

console.log('Running validation tests...\n')

testCases.forEach((testCase, index) => {
  try {
    const result = testCase.schema.parse(testCase.data)
    
    if (testCase.shouldPass) {
      console.log(`✅ ${index + 1}. ${testCase.name} - PASSED`)
      passed++
    } else {
      console.log(`❌ ${index + 1}. ${testCase.name} - FAILED (should have failed but passed)`)
      failed++
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      console.log(`✅ ${index + 1}. ${testCase.name} - PASSED (correctly failed validation)`)
      passed++
    } else {
      console.log(`❌ ${index + 1}. ${testCase.name} - FAILED`)
      console.log(`   Error: ${error.errors?.[0]?.message || error.message}`)
      failed++
    }
  }
})

console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All form validation tests passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some validation tests failed.')
  process.exit(1)
}