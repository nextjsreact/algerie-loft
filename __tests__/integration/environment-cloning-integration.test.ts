/**
 * Comprehensive Integration Tests for Environment Cloning System
 * 
 * This test suite validates the complete end-to-end cloning workflow
 * including all specialized systems (audit, conversations, reservations)
 * and data anonymization completeness.
 * 
 * Requirements: 1.4, 5.4, 8.4
 */

import { 
  EnvironmentCloner,
  Environment,
  CloneOptions,
  CloneResult,
  EnvironmentType,
  ProductionSafetyGuard,
  EnvironmentValidator,
  ValidationEngine,
  SpecializedSystemsCloner
} from '../../lib/environment-management'

describe('Environment Cloning Integration Tests', () => {
  let environmentCloner: EnvironmentCloner
  let safetyGuard: ProductionSafetyGuard
  let validator: EnvironmentValidator
  let validationEngine: ValidationEngine
  let specializedSystemsCloner: SpecializedSystemsCloner

  // Mock environments for testing
  const mockProductionEnv: Environment = {
    id: 'prod-001',
    name: 'Production',
    type: 'production',
    supabaseUrl: 'https://prod.supabase.co',
    supabaseAnonKey: 'prod-anon-key',
    supabaseServiceKey: 'prod-service-key',
    databaseUrl: 'postgresql://prod-db',
    status: 'read_only',
    isProduction: true,
    allowWrites: false, // CRITICAL: Production is always read-only
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date(),
    description: 'Production environment - READ ONLY'
  }

  const mockTestEnv: Environment = {
    id: 'test-001',
    name: 'Test Environment',
    type: 'test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceKey: 'test-service-key',
    databaseUrl: 'postgresql://test-db',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date(),
    description: 'Test environment for integration testing'
  }

  const mockTrainingEnv: Environment = {
    id: 'training-001',
    name: 'Training Environment',
    type: 'training',
    supabaseUrl: 'https://training.supabase.co',
    supabaseAnonKey: 'training-anon-key',
    supabaseServiceKey: 'training-service-key',
    databaseUrl: 'postgresql://training-db',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date(),
    description: 'Training environment with sample data'
  }

  beforeEach(() => {
    environmentCloner = new EnvironmentCloner()
    safetyGuard = ProductionSafetyGuard.getInstance()
    validator = new EnvironmentValidator()
    validationEngine = new ValidationEngine()
    specializedSystemsCloner = new SpecializedSystemsCloner()
  })

  afterEach(() => {
    // Clean up any active operations
    jest.clearAllMocks()
  })

  describe('Full Production to Test Environment Cloning', () => {
    const fullCloneOptions: CloneOptions = {
      anonymizeData: true,
      includeAuditLogs: true,
      includeConversations: true,
      includeReservations: true,
      preserveUserRoles: true,
      createBackup: true,
      validateAfterClone: true,
      specializedSystemsOptions: {
        includeAuditSystem: true,
        includeConversationsSystem: true,
        includeReservationsSystem: true,
        includeBillNotifications: true,
        includeTransactionReferences: true,
        anonymizeAuditLogs: true,
        anonymizeConversations: true,
        anonymizeReservations: true
      }
    }

    it('should successfully clone production to test environment with all systems', async () => {
      // Mock the actual database operations
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'production',
        isProduction: true,
        allowWrites: false,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result: CloneResult = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        fullCloneOptions
      )

      // Verify clone success
      expect(result.success).toBe(true)
      expect(result.sourceEnvironment).toBe(mockProductionEnv.id)
      expect(result.targetEnvironment).toBe(mockTestEnv.id)
      expect(result.operationId).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.completedAt).toBeInstanceOf(Date)

      // Verify statistics
      expect(result.statistics.tablesCloned).toBeGreaterThan(0)
      expect(result.statistics.recordsCloned).toBeGreaterThan(0)
      expect(result.statistics.recordsAnonymized).toBeGreaterThan(0)
      expect(result.statistics.functionsCloned).toBeGreaterThan(0)
      expect(result.statistics.triggersCloned).toBeGreaterThan(0)

      // Verify specialized systems were cloned
      expect(result.specializedSystemsResult).toBeDefined()
      expect(result.specializedSystemsResult?.systemsCloned).toContain('audit')
      expect(result.specializedSystemsResult?.systemsCloned).toContain('conversations')
      expect(result.specializedSystemsResult?.systemsCloned).toContain('reservations')

      // Verify backup was created
      expect(result.backupId).toBeDefined()

      // Verify validation was performed
      expect(result.validationResult).toBeDefined()
      expect(result.validationResult.isValid).toBe(true)

      // Verify no critical errors
      expect(result.errors).toHaveLength(0)
    }, 30000) // 30 second timeout for integration test

    it('should enforce production safety during cloning', async () => {
      // Test that production environment is properly protected
      jest.spyOn(safetyGuard, 'validateCloneSource').mockImplementation(async (env) => {
        if (env.type === 'production' && env.allowWrites !== false) {
          throw new Error('Production environment must be read-only')
        }
      })

      // Attempt to clone with production that allows writes (should fail)
      const unsafeProductionEnv = { ...mockProductionEnv, allowWrites: true }

      await expect(
        environmentCloner.cloneEnvironment(
          unsafeProductionEnv,
          mockTestEnv,
          fullCloneOptions
        )
      ).rejects.toThrow('Production environment must be read-only')
    })

    it('should prevent cloning to production environment', async () => {
      // Test that production cannot be used as target
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockImplementation(async (env) => {
        if (env.type === 'production') {
          throw new Error('Cannot clone to production environment')
        }
      })

      await expect(
        environmentCloner.cloneEnvironment(
          mockTestEnv,
          mockProductionEnv,
          fullCloneOptions
        )
      ).rejects.toThrow('Cannot clone to production environment')
    })
  })

  describe('Specialized Systems Integration Testing', () => {
    it('should clone audit system with proper log preservation', async () => {
      const auditCloneOptions: CloneOptions = {
        anonymizeData: true,
        includeAuditLogs: true,
        includeConversations: false,
        includeReservations: false,
        preserveUserRoles: true,
        createBackup: true,
        validateAfterClone: true,
        specializedSystemsOptions: {
          includeAuditSystem: true,
          includeConversationsSystem: false,
          includeReservationsSystem: false,
          includeBillNotifications: false,
          includeTransactionReferences: false,
          anonymizeAuditLogs: true,
          anonymizeConversations: false,
          anonymizeReservations: false
        }
      }

      // Mock successful audit system cloning
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockResolvedValue({
        success: true,
        systemsCloned: ['audit'],
        auditResult: {
          success: true,
          tablesCloned: ['audit_logs', 'audit_triggers', 'audit_functions'],
          functionsCloned: ['audit_trigger_function', 'audit_log_function'],
          triggersCloned: ['audit_trigger_lofts', 'audit_trigger_transactions'],
          logsAnonymized: 1500,
          structurePreserved: true
        },
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        auditCloneOptions
      )

      expect(result.success).toBe(true)
      expect(result.specializedSystemsResult?.auditResult).toBeDefined()
      expect(result.specializedSystemsResult?.auditResult?.success).toBe(true)
      expect(result.specializedSystemsResult?.auditResult?.logsAnonymized).toBe(1500)
      expect(result.specializedSystemsResult?.auditResult?.structurePreserved).toBe(true)
    })

    it('should clone conversations system with message anonymization', async () => {
      const conversationsCloneOptions: CloneOptions = {
        anonymizeData: true,
        includeAuditLogs: false,
        includeConversations: true,
        includeReservations: false,
        preserveUserRoles: true,
        createBackup: true,
        validateAfterClone: true,
        specializedSystemsOptions: {
          includeAuditSystem: false,
          includeConversationsSystem: true,
          includeReservationsSystem: false,
          includeBillNotifications: false,
          includeTransactionReferences: false,
          anonymizeAuditLogs: false,
          anonymizeConversations: true,
          anonymizeReservations: false
        }
      }

      // Mock successful conversations system cloning
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockResolvedValue({
        success: true,
        systemsCloned: ['conversations'],
        conversationsResult: {
          success: true,
          conversationsCloned: 250,
          participantsCloned: 500,
          messagesCloned: 3500,
          messagesAnonymized: 3500,
          relationshipsPreserved: true,
          realTimeFunctionalityValidated: true
        },
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        conversationsCloneOptions
      )

      expect(result.success).toBe(true)
      expect(result.specializedSystemsResult?.conversationsResult).toBeDefined()
      expect(result.specializedSystemsResult?.conversationsResult?.success).toBe(true)
      expect(result.specializedSystemsResult?.conversationsResult?.messagesAnonymized).toBe(3500)
      expect(result.specializedSystemsResult?.conversationsResult?.relationshipsPreserved).toBe(true)
      expect(result.specializedSystemsResult?.conversationsResult?.realTimeFunctionalityValidated).toBe(true)
    })

    it('should clone reservations system with guest data anonymization', async () => {
      const reservationsCloneOptions: CloneOptions = {
        anonymizeData: true,
        includeAuditLogs: false,
        includeConversations: false,
        includeReservations: true,
        preserveUserRoles: true,
        createBackup: true,
        validateAfterClone: true,
        specializedSystemsOptions: {
          includeAuditSystem: false,
          includeConversationsSystem: false,
          includeReservationsSystem: true,
          includeBillNotifications: false,
          includeTransactionReferences: false,
          anonymizeAuditLogs: false,
          anonymizeConversations: false,
          anonymizeReservations: true
        }
      }

      // Mock successful reservations system cloning
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockResolvedValue({
        success: true,
        systemsCloned: ['reservations'],
        reservationsResult: {
          success: true,
          reservationsCloned: 800,
          availabilityCalendarCloned: true,
          guestDataAnonymized: 800,
          pricingDataAnonymized: 800,
          paymentDataAnonymized: 600,
          calendarConsistencyValidated: true
        },
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        reservationsCloneOptions
      )

      expect(result.success).toBe(true)
      expect(result.specializedSystemsResult?.reservationsResult).toBeDefined()
      expect(result.specializedSystemsResult?.reservationsResult?.success).toBe(true)
      expect(result.specializedSystemsResult?.reservationsResult?.guestDataAnonymized).toBe(800)
      expect(result.specializedSystemsResult?.reservationsResult?.pricingDataAnonymized).toBe(800)
      expect(result.specializedSystemsResult?.reservationsResult?.calendarConsistencyValidated).toBe(true)
    })
  })

  describe('Data Anonymization Completeness Validation', () => {
    it('should validate complete anonymization of sensitive data', async () => {
      const anonymizationOptions: CloneOptions = {
        anonymizeData: true,
        includeAuditLogs: true,
        includeConversations: true,
        includeReservations: true,
        preserveUserRoles: false, // Test without preserving roles
        createBackup: true,
        validateAfterClone: true,
        specializedSystemsOptions: {
          includeAuditSystem: true,
          includeConversationsSystem: true,
          includeReservationsSystem: true,
          includeBillNotifications: true,
          includeTransactionReferences: true,
          anonymizeAuditLogs: true,
          anonymizeConversations: true,
          anonymizeReservations: true
        }
      }

      // Mock comprehensive anonymization results
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockResolvedValue({
        success: true,
        systemsCloned: ['audit', 'conversations', 'reservations'],
        auditResult: {
          success: true,
          tablesCloned: ['audit_logs'],
          functionsCloned: ['audit_function'],
          triggersCloned: ['audit_trigger'],
          logsAnonymized: 2000,
          structurePreserved: true
        },
        conversationsResult: {
          success: true,
          conversationsCloned: 300,
          participantsCloned: 600,
          messagesCloned: 4000,
          messagesAnonymized: 4000,
          relationshipsPreserved: true,
          realTimeFunctionalityValidated: true
        },
        reservationsResult: {
          success: true,
          reservationsCloned: 1000,
          availabilityCalendarCloned: true,
          guestDataAnonymized: 1000,
          pricingDataAnonymized: 1000,
          paymentDataAnonymized: 800,
          calendarConsistencyValidated: true
        },
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        anonymizationOptions
      )

      // Verify anonymization completeness
      expect(result.success).toBe(true)
      expect(result.statistics.recordsAnonymized).toBeGreaterThan(0)

      // Verify audit logs anonymization
      expect(result.specializedSystemsResult?.auditResult?.logsAnonymized).toBe(2000)

      // Verify conversations anonymization
      expect(result.specializedSystemsResult?.conversationsResult?.messagesAnonymized).toBe(4000)

      // Verify reservations anonymization
      expect(result.specializedSystemsResult?.reservationsResult?.guestDataAnonymized).toBe(1000)
      expect(result.specializedSystemsResult?.reservationsResult?.pricingDataAnonymized).toBe(1000)
      expect(result.specializedSystemsResult?.reservationsResult?.paymentDataAnonymized).toBe(800)

      // Verify data integrity is maintained
      expect(result.specializedSystemsResult?.auditResult?.structurePreserved).toBe(true)
      expect(result.specializedSystemsResult?.conversationsResult?.relationshipsPreserved).toBe(true)
      expect(result.specializedSystemsResult?.reservationsResult?.calendarConsistencyValidated).toBe(true)
    })

    it('should generate comprehensive anonymization report', async () => {
      // Mock validation engine to return detailed anonymization report
      jest.spyOn(validationEngine, 'validateAnonymization').mockResolvedValue({
        isComplete: true,
        tablesValidated: [
          {
            tableName: 'users',
            originalRecords: 500,
            anonymizedRecords: 500,
            anonymizedFields: ['email', 'full_name', 'phone'],
            preservedRelationships: 500,
            generatedFakeData: 500
          },
          {
            tableName: 'reservations',
            originalRecords: 1000,
            anonymizedRecords: 1000,
            anonymizedFields: ['guest_name', 'guest_email', 'guest_phone'],
            preservedRelationships: 1000,
            generatedFakeData: 1000
          },
          {
            tableName: 'conversations_messages',
            originalRecords: 4000,
            anonymizedRecords: 4000,
            anonymizedFields: ['content', 'sender_name'],
            preservedRelationships: 4000,
            generatedFakeData: 4000
          }
        ],
        sensitiveDataRemoved: true,
        relationshipsIntact: true,
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          createBackup: true,
          validateAfterClone: true
        }
      )

      expect(result.success).toBe(true)
      expect(result.validationResult).toBeDefined()

      // Verify anonymization validation was performed
      expect(validationEngine.validateAnonymization).toHaveBeenCalled()
    })
  })

  describe('Data Integrity Validation', () => {
    it('should validate referential integrity after cloning', async () => {
      // Mock validation engine to check data integrity
      jest.spyOn(validationEngine, 'validateDataIntegrity').mockResolvedValue({
        isValid: true,
        foreignKeyConstraints: {
          total: 45,
          valid: 45,
          invalid: 0
        },
        uniqueConstraints: {
          total: 20,
          valid: 20,
          invalid: 0
        },
        checkConstraints: {
          total: 15,
          valid: 15,
          invalid: 0
        },
        indexConsistency: {
          total: 35,
          consistent: 35,
          inconsistent: 0
        },
        errors: [],
        warnings: []
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          createBackup: true,
          validateAfterClone: true
        }
      )

      expect(result.success).toBe(true)
      expect(validationEngine.validateDataIntegrity).toHaveBeenCalled()
    })

    it('should detect and report data integrity issues', async () => {
      // Mock validation engine to report integrity issues
      jest.spyOn(validationEngine, 'validateDataIntegrity').mockResolvedValue({
        isValid: false,
        foreignKeyConstraints: {
          total: 45,
          valid: 43,
          invalid: 2
        },
        uniqueConstraints: {
          total: 20,
          valid: 20,
          invalid: 0
        },
        checkConstraints: {
          total: 15,
          valid: 14,
          invalid: 1
        },
        indexConsistency: {
          total: 35,
          consistent: 35,
          inconsistent: 0
        },
        errors: [
          'Foreign key constraint violation in reservations table',
          'Check constraint violation in transactions table'
        ],
        warnings: [
          'Some indexes may need rebuilding'
        ]
      })

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          createBackup: true,
          validateAfterClone: true
        }
      )

      expect(result.success).toBe(true) // Clone may succeed even with warnings
      expect(result.warnings).toContain('Some indexes may need rebuilding')
      expect(validationEngine.validateDataIntegrity).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle clone failures gracefully with rollback', async () => {
      // Mock a failure during cloning
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      // Mock a failure in specialized systems cloning
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockRejectedValue(
        new Error('Database connection lost during audit system cloning')
      )

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          createBackup: true,
          validateAfterClone: true,
          specializedSystemsOptions: {
            includeAuditSystem: true,
            includeConversationsSystem: true,
            includeReservationsSystem: true,
            includeBillNotifications: true,
            includeTransactionReferences: true,
            anonymizeAuditLogs: true,
            anonymizeConversations: true,
            anonymizeReservations: true
          }
        }
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database connection lost during audit system cloning')
      expect(result.backupId).toBeDefined() // Backup should still be created
    })

    it('should validate production safety even during error conditions', async () => {
      // Mock production safety validation failure
      jest.spyOn(safetyGuard, 'validateCloneSource').mockRejectedValue(
        new Error('PRODUCTION ACCESS BLOCKED: Production environment must be read-only')
      )

      await expect(
        environmentCloner.cloneEnvironment(
          mockProductionEnv,
          mockTestEnv,
          {
            anonymizeData: true,
            includeAuditLogs: true,
            includeConversations: true,
            includeReservations: true,
            preserveUserRoles: true,
            createBackup: true,
            validateAfterClone: true
          }
        )
      ).rejects.toThrow('PRODUCTION ACCESS BLOCKED: Production environment must be read-only')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large dataset cloning within reasonable time limits', async () => {
      const startTime = Date.now()

      // Mock large dataset cloning
      jest.spyOn(specializedSystemsCloner, 'cloneSpecializedSystems').mockImplementation(
        async () => {
          // Simulate processing time for large dataset
          await new Promise(resolve => setTimeout(resolve, 1000))
          return {
            success: true,
            systemsCloned: ['audit', 'conversations', 'reservations'],
            auditResult: {
              success: true,
              tablesCloned: ['audit_logs'],
              functionsCloned: ['audit_function'],
              triggersCloned: ['audit_trigger'],
              logsAnonymized: 50000, // Large dataset
              structurePreserved: true
            },
            conversationsResult: {
              success: true,
              conversationsCloned: 5000,
              participantsCloned: 10000,
              messagesCloned: 100000, // Large dataset
              messagesAnonymized: 100000,
              relationshipsPreserved: true,
              realTimeFunctionalityValidated: true
            },
            reservationsResult: {
              success: true,
              reservationsCloned: 25000, // Large dataset
              availabilityCalendarCloned: true,
              guestDataAnonymized: 25000,
              pricingDataAnonymized: 25000,
              paymentDataAnonymized: 20000,
              calendarConsistencyValidated: true
            },
            errors: [],
            warnings: []
          }
        }
      )

      // Mock other required methods
      jest.spyOn(safetyGuard, 'validateCloneSource').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateCloneTarget').mockResolvedValue(undefined)
      jest.spyOn(safetyGuard, 'validateDatabaseConnection').mockResolvedValue(undefined)
      jest.spyOn(validator, 'validateEnvironment').mockResolvedValue({
        isValid: true,
        environmentType: 'test',
        isProduction: false,
        allowWrites: true,
        errors: [],
        warnings: [],
        safetyChecks: {
          productionProtected: true,
          writeAccessControlled: true,
          connectionValidated: true
        }
      })

      const result = await environmentCloner.cloneEnvironment(
        mockProductionEnv,
        mockTestEnv,
        {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          createBackup: true,
          validateAfterClone: true,
          specializedSystemsOptions: {
            includeAuditSystem: true,
            includeConversationsSystem: true,
            includeReservationsSystem: true,
            includeBillNotifications: true,
            includeTransactionReferences: true,
            anonymizeAuditLogs: true,
            anonymizeConversations: true,
            anonymizeReservations: true
          }
        }
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      expect(result.statistics.recordsCloned).toBeGreaterThan(100000)
      expect(result.statistics.recordsAnonymized).toBeGreaterThan(100000)
    }, 35000) // 35 second timeout for performance test
  })
})