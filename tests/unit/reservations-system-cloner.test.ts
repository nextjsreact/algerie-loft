/**
 * Unit Tests for Reservations System Cloner
 * 
 * Tests the reservations system cloning functionality with calendar and pricing
 * Requirements: 8.3
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ReservationsSystemCloner } from '@/lib/environment-management/specialized-cloning/reservations-system-cloner'
import { Environment } from '@/lib/environment-management/types'

// Mock dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/logger')
jest.mock('@/lib/environment-management/production-safety-guard')
jest.mock('@/lib/environment-management/anonymization')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis()
}

const createMockEnvironment = (type: 'production' | 'test'): Environment => ({
  id: `env_${type}`,
  name: `${type} Environment`,
  type,
  supabaseUrl: `https://${type}.supabase.co`,
  supabaseAnonKey: 'mock_key',
  supabaseServiceKey: 'mock_service_key',
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `Mock ${type} environment`
})

describe('🏨 Reservations System Cloner Unit Tests', () => {
  let reservationsCloner: ReservationsSystemCloner
  let productionEnv: Environment
  let testEnv: Environment

  beforeEach(() => {
    jest.clearAllMocks()
    reservationsCloner = new ReservationsSystemCloner()
    productionEnv = createMockEnvironment('production')
    testEnv = createMockEnvironment('test')
    
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Schema Analysis', () => {
    it('should identify reservations tables correctly', async () => {
      const mockReservationTables = [
        { table_name: 'reservations', table_schema: 'public' },
        { table_name: 'loft_availability', table_schema: 'public' },
        { table_name: 'pricing_rules', table_schema: 'public' },
        { table_name: 'reservation_payments', table_schema: 'public' }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockReservationTables,
        error: null
      })

      const tables = await reservationsCloner.analyzeReservationsSchema(productionEnv)

      expect(tables).toHaveLength(4)
      expect(tables.map(t => t.tableName)).toContain('reservations')
      expect(tables.map(t => t.tableName)).toContain('loft_availability')
      expect(tables.map(t => t.tableName)).toContain('pricing_rules')
      expect(tables.map(t => t.tableName)).toContain('reservation_payments')
    })

    it('should extract reservation relationships correctly', async () => {
      const mockRelationships = [
        {
          table_name: 'reservations',
          column_name: 'loft_id',
          foreign_table_name: 'lofts',
          foreign_column_name: 'id'
        },
        {
          table_name: 'loft_availability',
          column_name: 'loft_id',
          foreign_table_name: 'lofts',
          foreign_column_name: 'id'
        },
        {
          table_name: 'reservation_payments',
          column_name: 'reservation_id',
          foreign_table_name: 'reservations',
          foreign_column_name: 'id'
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockRelationships,
        error: null
      })

      const relationships = await reservationsCloner.extractReservationRelationships(productionEnv)

      expect(relationships).toHaveLength(3)
      expect(relationships.some(r => r.fromTable === 'reservations' && r.toTable === 'lofts')).toBe(true)
      expect(relationships.some(r => r.fromTable === 'loft_availability' && r.toTable === 'lofts')).toBe(true)
      expect(relationships.some(r => r.fromTable === 'reservation_payments' && r.toTable === 'reservations')).toBe(true)
    })
  })

  describe('Reservation Data Cloning', () => {
    it('should clone reservations with complete data', async () => {
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+213555123456',
          guest_address: '123 Main St, Algiers',
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          total_amount: 5000,
          currency: 'DZD',
          status: 'confirmed',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'res2',
          loft_id: 'loft2',
          guest_name: 'Jane Smith',
          guest_email: 'jane@example.com',
          guest_phone: '+213555654321',
          check_in: '2024-02-01',
          check_out: '2024-02-05',
          total_amount: 3200,
          currency: 'DZD',
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockReservations,
        error: null
      })

      const result = await reservationsCloner.cloneReservationData(
        productionEnv,
        testEnv,
        {
          includeReservations: true,
          anonymizeGuestData: false,
          statusFilter: ['confirmed', 'pending']
        }
      )

      expect(result.reservationsCloned).toBe(2)
      expect(result.success).toBe(true)
    })

    it('should clone availability calendar data', async () => {
      const mockAvailability = [
        {
          id: 'avail1',
          loft_id: 'loft1',
          date: '2024-01-15',
          is_available: false,
          price_per_night: 1000,
          minimum_stay: 1,
          maximum_stay: 30,
          created_at: new Date()
        },
        {
          id: 'avail2',
          loft_id: 'loft1',
          date: '2024-01-16',
          is_available: false,
          price_per_night: 1000,
          minimum_stay: 1,
          maximum_stay: 30,
          created_at: new Date()
        },
        {
          id: 'avail3',
          loft_id: 'loft1',
          date: '2024-01-17',
          is_available: true,
          price_per_night: 1200,
          minimum_stay: 2,
          maximum_stay: 14,
          created_at: new Date()
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockAvailability,
        error: null
      })

      const result = await reservationsCloner.cloneAvailabilityData(
        productionEnv,
        testEnv,
        {
          includeAvailability: true,
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        }
      )

      expect(result.availabilityRecordsCloned).toBe(3)
      expect(result.success).toBe(true)
    })

    it('should clone pricing rules and configurations', async () => {
      const mockPricingRules = [
        {
          id: 'price1',
          loft_id: 'loft1',
          rule_name: 'High Season',
          base_price: 1000,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5,
          weekly_discount: 0.1,
          monthly_discount: 0.2,
          start_date: '2024-06-01',
          end_date: '2024-08-31',
          is_active: true
        },
        {
          id: 'price2',
          loft_id: 'loft1',
          rule_name: 'Low Season',
          base_price: 800,
          weekend_multiplier: 1.1,
          holiday_multiplier: 1.3,
          weekly_discount: 0.15,
          monthly_discount: 0.25,
          start_date: '2024-01-01',
          end_date: '2024-05-31',
          is_active: true
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockPricingRules,
        error: null
      })

      const result = await reservationsCloner.clonePricingData(
        productionEnv,
        testEnv,
        {
          includePricingRules: true,
          anonymizePricingData: false
        }
      )

      expect(result.pricingRulesCloned).toBe(2)
      expect(result.success).toBe(true)
    })

    it('should clone payment data with reservations', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          reservation_id: 'res1',
          amount: 2500,
          currency: 'DZD',
          payment_method: 'card',
          payment_status: 'completed',
          transaction_id: 'txn_123456',
          payment_date: new Date(),
          created_at: new Date()
        },
        {
          id: 'pay2',
          reservation_id: 'res1',
          amount: 2500,
          currency: 'DZD',
          payment_method: 'cash',
          payment_status: 'completed',
          transaction_id: 'txn_789012',
          payment_date: new Date(),
          created_at: new Date()
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockPayments,
        error: null
      })

      const result = await reservationsCloner.clonePaymentData(
        productionEnv,
        testEnv,
        {
          includePayments: true,
          anonymizePaymentData: false
        }
      )

      expect(result.paymentsCloned).toBe(2)
      expect(result.success).toBe(true)
    })
  })

  describe('Guest Data Anonymization', () => {
    it('should anonymize guest personal information', async () => {
      const mockReservations = [
        {
          id: 'res1',
          guest_name: 'John Doe',
          guest_email: 'john.doe@gmail.com',
          guest_phone: '+213555123456',
          guest_address: '123 Main Street, Algiers, Algeria',
          guest_nationality: 'Algerian',
          guest_id_number: 'ID123456789',
          emergency_contact_name: 'Jane Doe',
          emergency_contact_phone: '+213555987654'
        }
      ]

      const anonymizedReservations = await reservationsCloner.anonymizeGuestData(mockReservations, {
        anonymizeNames: true,
        anonymizeEmails: true,
        anonymizePhones: true,
        anonymizeAddresses: true,
        anonymizeIdNumbers: true,
        preserveNationality: true,
        preserveReservationStructure: true
      })

      expect(anonymizedReservations).toHaveLength(1)
      const anonymized = anonymizedReservations[0]

      // Personal data should be anonymized
      expect(anonymized.guest_name).not.toBe('John Doe')
      expect(anonymized.guest_email).not.toBe('john.doe@gmail.com')
      expect(anonymized.guest_phone).not.toBe('+213555123456')
      expect(anonymized.guest_address).not.toBe('123 Main Street, Algiers, Algeria')
      expect(anonymized.guest_id_number).not.toBe('ID123456789')
      expect(anonymized.emergency_contact_name).not.toBe('Jane Doe')
      expect(anonymized.emergency_contact_phone).not.toBe('+213555987654')

      // Nationality should be preserved
      expect(anonymized.guest_nationality).toBe('Algerian')

      // Structure should be maintained
      expect(anonymized.id).toBe('res1')
    })

    it('should maintain realistic data formats after anonymization', async () => {
      const mockReservations = [
        {
          id: 'res1',
          guest_name: 'Ahmed Ben Ali',
          guest_email: 'ahmed.benali@email.dz',
          guest_phone: '+213555123456',
          guest_address: '15 Rue Didouche Mourad, Alger Centre, Algiers'
        }
      ]

      const anonymizedReservations = await reservationsCloner.anonymizeGuestData(mockReservations, {
        anonymizeNames: true,
        anonymizeEmails: true,
        anonymizePhones: true,
        anonymizeAddresses: true,
        maintainRealisticFormats: true
      })

      const anonymized = anonymizedReservations[0]

      // Check that formats are realistic
      expect(anonymized.guest_name).toMatch(/^[A-Za-z\s]+$/) // Valid name format
      expect(anonymized.guest_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) // Valid email format
      expect(anonymized.guest_phone).toMatch(/^\+213\d{9}$/) // Valid Algerian phone format
      expect(anonymized.guest_address).toContain('Algiers') // Should maintain city context
    })

    it('should preserve guest relationships across reservations', async () => {
      const mockReservations = [
        {
          id: 'res1',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+213555123456'
        },
        {
          id: 'res2',
          guest_name: 'John Doe', // Same guest
          guest_email: 'john@example.com',
          guest_phone: '+213555123456'
        },
        {
          id: 'res3',
          guest_name: 'Jane Smith', // Different guest
          guest_email: 'jane@example.com',
          guest_phone: '+213555654321'
        }
      ]

      const anonymizedReservations = await reservationsCloner.anonymizeGuestData(mockReservations, {
        anonymizeNames: true,
        anonymizeEmails: true,
        anonymizePhones: true,
        preserveGuestRelationships: true
      })

      // Same guest should have consistent anonymized data
      expect(anonymizedReservations[0].guest_name).toBe(anonymizedReservations[1].guest_name)
      expect(anonymizedReservations[0].guest_email).toBe(anonymizedReservations[1].guest_email)
      expect(anonymizedReservations[0].guest_phone).toBe(anonymizedReservations[1].guest_phone)

      // Different guest should have different anonymized data
      expect(anonymizedReservations[0].guest_name).not.toBe(anonymizedReservations[2].guest_name)
      expect(anonymizedReservations[0].guest_email).not.toBe(anonymizedReservations[2].guest_email)
    })
  })

  describe('Pricing Data Anonymization', () => {
    it('should anonymize pricing while maintaining realistic ranges', async () => {
      const mockPricingRules = [
        {
          id: 'price1',
          loft_id: 'loft1',
          base_price: 1000,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5,
          weekly_discount: 0.1,
          monthly_discount: 0.2
        },
        {
          id: 'price2',
          loft_id: 'loft2',
          base_price: 1500,
          weekend_multiplier: 1.3,
          holiday_multiplier: 1.6,
          weekly_discount: 0.15,
          monthly_discount: 0.25
        }
      ]

      const anonymizedPricing = await reservationsCloner.anonymizePricingData(mockPricingRules, {
        anonymizeBasePrices: true,
        maintainPriceRanges: true,
        preserveMultipliers: false,
        preserveDiscounts: true,
        priceVariationRange: 0.3 // ±30% variation
      })

      expect(anonymizedPricing).toHaveLength(2)

      // Prices should be different but within reasonable range
      expect(anonymizedPricing[0].base_price).not.toBe(1000)
      expect(anonymizedPricing[0].base_price).toBeGreaterThan(700) // 1000 - 30%
      expect(anonymizedPricing[0].base_price).toBeLessThan(1300) // 1000 + 30%

      expect(anonymizedPricing[1].base_price).not.toBe(1500)
      expect(anonymizedPricing[1].base_price).toBeGreaterThan(1050) // 1500 - 30%
      expect(anonymizedPricing[1].base_price).toBeLessThan(1950) // 1500 + 30%

      // Discounts should be preserved
      expect(anonymizedPricing[0].weekly_discount).toBe(0.1)
      expect(anonymizedPricing[0].monthly_discount).toBe(0.2)
    })

    it('should anonymize payment amounts consistently', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          reservation_id: 'res1',
          amount: 5000,
          currency: 'DZD'
        },
        {
          id: 'pay2',
          reservation_id: 'res1', // Same reservation
          amount: 2500,
          currency: 'DZD'
        }
      ]

      const anonymizedPayments = await reservationsCloner.anonymizePaymentData(mockPayments, {
        anonymizeAmounts: true,
        maintainPaymentRatios: true,
        preserveCurrency: true
      })

      // Payment amounts should maintain their ratio
      const originalRatio = mockPayments[0].amount / mockPayments[1].amount
      const anonymizedRatio = anonymizedPayments[0].amount / anonymizedPayments[1].amount
      
      expect(Math.abs(originalRatio - anonymizedRatio)).toBeLessThan(0.1) // Within 10% of original ratio
      
      // Currency should be preserved
      expect(anonymizedPayments[0].currency).toBe('DZD')
      expect(anonymizedPayments[1].currency).toBe('DZD')
    })
  })

  describe('Calendar Consistency Validation', () => {
    it('should detect calendar conflicts between reservations and availability', async () => {
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          status: 'confirmed'
        }
      ]

      const mockAvailability = [
        {
          id: 'avail1',
          loft_id: 'loft1',
          date: '2024-01-15',
          is_available: true // Conflict: should be false
        },
        {
          id: 'avail2',
          loft_id: 'loft1',
          date: '2024-01-16',
          is_available: false // Correct
        },
        {
          id: 'avail3',
          loft_id: 'loft1',
          date: '2024-01-17',
          is_available: false // Correct
        }
      ]

      const validation = await reservationsCloner.validateCalendarConsistency(
        mockReservations,
        mockAvailability
      )

      expect(validation.hasConflicts).toBe(true)
      expect(validation.conflicts).toHaveLength(1)
      expect(validation.conflicts[0].date).toBe('2024-01-15')
      expect(validation.conflicts[0].type).toBe('availability_conflict')
    })

    it('should detect overlapping reservations', async () => {
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          status: 'confirmed'
        },
        {
          id: 'res2',
          loft_id: 'loft1',
          check_in: '2024-01-17', // Overlaps with res1
          check_out: '2024-01-20',
          status: 'confirmed'
        }
      ]

      const validation = await reservationsCloner.validateReservationOverlaps(mockReservations)

      expect(validation.hasOverlaps).toBe(true)
      expect(validation.overlaps).toHaveLength(1)
      expect(validation.overlaps[0].reservation1).toBe('res1')
      expect(validation.overlaps[0].reservation2).toBe('res2')
      expect(validation.overlaps[0].overlapDates).toContain('2024-01-17')
    })

    it('should validate pricing consistency across calendar', async () => {
      const mockAvailability = [
        {
          loft_id: 'loft1',
          date: '2024-01-15',
          price_per_night: 1000
        },
        {
          loft_id: 'loft1',
          date: '2024-01-16',
          price_per_night: 1500 // Significant price jump
        }
      ]

      const mockPricingRules = [
        {
          loft_id: 'loft1',
          base_price: 1000,
          weekend_multiplier: 1.2 // Should be ~1200, not 1500
        }
      ]

      const validation = await reservationsCloner.validatePricingConsistency(
        mockAvailability,
        mockPricingRules
      )

      expect(validation.hasInconsistencies).toBe(true)
      expect(validation.inconsistencies).toHaveLength(1)
      expect(validation.inconsistencies[0].date).toBe('2024-01-16')
      expect(validation.inconsistencies[0].type).toBe('price_rule_mismatch')
    })
  })

  describe('Reservation Filtering and Business Logic', () => {
    it('should filter reservations by status correctly', async () => {
      const mockReservations = [
        { id: 'res1', status: 'confirmed', guest_name: 'John' },
        { id: 'res2', status: 'pending', guest_name: 'Jane' },
        { id: 'res3', status: 'cancelled', guest_name: 'Bob' },
        { id: 'res4', status: 'completed', guest_name: 'Alice' }
      ]

      const filteredReservations = await reservationsCloner.filterReservations(mockReservations, {
        statusFilter: ['confirmed', 'pending']
      })

      expect(filteredReservations).toHaveLength(2)
      expect(filteredReservations.map(r => r.status)).toEqual(['confirmed', 'pending'])
    })

    it('should filter reservations by date range', async () => {
      const mockReservations = [
        {
          id: 'res1',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          created_at: new Date('2024-01-10')
        },
        {
          id: 'res2',
          check_in: '2024-06-15',
          check_out: '2024-06-18',
          created_at: new Date('2024-06-10')
        },
        {
          id: 'res3',
          check_in: '2023-12-15',
          check_out: '2023-12-18',
          created_at: new Date('2023-12-10')
        }
      ]

      const filteredReservations = await reservationsCloner.filterReservations(mockReservations, {
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      })

      expect(filteredReservations).toHaveLength(2)
      expect(filteredReservations.map(r => r.id)).toEqual(['res1', 'res2'])
    })

    it('should filter reservations by age', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 120) // 120 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 30) // 30 days old

      const mockReservations = [
        {
          id: 'res1',
          created_at: recentDate,
          status: 'confirmed'
        },
        {
          id: 'res2',
          created_at: oldDate,
          status: 'confirmed'
        }
      ]

      const filteredReservations = await reservationsCloner.filterReservations(mockReservations, {
        maxAge: 90 // Only reservations newer than 90 days
      })

      expect(filteredReservations).toHaveLength(1)
      expect(filteredReservations[0].id).toBe('res1')
    })
  })

  describe('Error Handling and Data Integrity', () => {
    it('should handle corrupted reservation data gracefully', async () => {
      const corruptedReservations = [
        {
          id: null, // Missing ID
          loft_id: 'loft1',
          check_in: '2024-01-15',
          check_out: '2024-01-10', // Invalid: check_out before check_in
          status: 'confirmed'
        },
        {
          id: 'res2',
          loft_id: null, // Missing loft_id
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          status: 'invalid_status' // Invalid status
        }
      ]

      const validation = await reservationsCloner.validateReservationData(corruptedReservations)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(4) // 4 different errors
      expect(validation.errors.some(e => e.includes('missing ID'))).toBe(true)
      expect(validation.errors.some(e => e.includes('invalid date range'))).toBe(true)
      expect(validation.errors.some(e => e.includes('missing loft_id'))).toBe(true)
      expect(validation.errors.some(e => e.includes('invalid status'))).toBe(true)
    })

    it('should handle missing foreign key references', async () => {
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'nonexistent_loft', // Foreign key violation
          guest_name: 'John Doe',
          status: 'confirmed'
        }
      ]

      const mockLofts = [
        { id: 'loft1', name: 'Existing Loft' }
        // 'nonexistent_loft' is not in this list
      ]

      const validation = await reservationsCloner.validateForeignKeyReferences(
        mockReservations,
        mockLofts
      )

      expect(validation.hasViolations).toBe(true)
      expect(validation.violations).toHaveLength(1)
      expect(validation.violations[0].table).toBe('reservations')
      expect(validation.violations[0].column).toBe('loft_id')
      expect(validation.violations[0].value).toBe('nonexistent_loft')
    })

    it('should handle payment calculation errors', async () => {
      const mockReservations = [
        {
          id: 'res1',
          total_amount: 5000,
          currency: 'DZD'
        }
      ]

      const mockPayments = [
        {
          reservation_id: 'res1',
          amount: 2000,
          currency: 'DZD'
        },
        {
          reservation_id: 'res1',
          amount: 2000,
          currency: 'DZD'
        }
        // Total payments: 4000, but reservation total: 5000 (missing 1000)
      ]

      const validation = await reservationsCloner.validatePaymentTotals(
        mockReservations,
        mockPayments
      )

      expect(validation.hasDiscrepancies).toBe(true)
      expect(validation.discrepancies).toHaveLength(1)
      expect(validation.discrepancies[0].reservationId).toBe('res1')
      expect(validation.discrepancies[0].expectedTotal).toBe(5000)
      expect(validation.discrepancies[0].actualTotal).toBe(4000)
      expect(validation.discrepancies[0].difference).toBe(1000)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large reservation datasets efficiently', async () => {
      const startTime = Date.now()

      // Mock large dataset
      const largeReservationSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `res${i}`,
        loft_id: `loft${i % 100}`, // 100 different lofts
        guest_name: `Guest ${i}`,
        guest_email: `guest${i}@example.com`,
        check_in: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + (i + 3) * 86400000).toISOString().split('T')[0],
        total_amount: 1000 + (i % 1000),
        status: ['confirmed', 'pending', 'completed'][i % 3]
      }))

      const result = await reservationsCloner.cloneReservationData(
        productionEnv,
        testEnv,
        {
          includeReservations: true,
          batchSize: 1000,
          parallelProcessing: true
        }
      )

      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      expect(result.optimizationsApplied).toContain('batch_processing')
    })

    it('should optimize memory usage during large data anonymization', async () => {
      const memoryBefore = process.memoryUsage().heapUsed

      // Mock large dataset with detailed guest information
      const largeGuestData = Array.from({ length: 5000 }, (_, i) => ({
        id: `res${i}`,
        guest_name: `Guest Name ${i}`,
        guest_email: `guest${i}@example.com`,
        guest_phone: `+21355512${String(i).padStart(4, '0')}`,
        guest_address: `${i} Street Name, City, Algeria`,
        guest_notes: 'A'.repeat(500), // Large text field
        special_requests: 'B'.repeat(300)
      }))

      const anonymizedData = await reservationsCloner.anonymizeGuestData(largeGuestData, {
        anonymizeNames: true,
        anonymizeEmails: true,
        anonymizePhones: true,
        anonymizeAddresses: true,
        streamProcessing: true
      })

      const memoryAfter = process.memoryUsage().heapUsed
      const memoryIncrease = memoryAfter - memoryBefore

      expect(anonymizedData).toHaveLength(5000)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // Less than 100MB increase
    })
  })
})