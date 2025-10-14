/**
 * Mock implementations for Environment Management components
 * Used in integration tests to simulate real behavior without external dependencies
 */

import { 
  Environment, 
  EnvironmentValidationResult, 
  ProductionAccessError,
  SecurityAlert 
} from '../../../lib/environment-management/types'

// Mock ProductionSafetyGuard
export class MockProductionSafetyGuard {
  private static instance: MockProductionSafetyGuard
  private securityAlerts: SecurityAlert[] = []

  public static getInstance(): MockProductionSafetyGuard {
    if (!MockProductionSafetyGuard.instance) {
      MockProductionSafetyGuard.instance = new MockProductionSafetyGuard()
    }
    return MockProductionSafetyGuard.instance
  }

  public async validateCloneSource(env: Environment): Promise<void> {
    if (env.type === 'production' && env.allowWrites !== false) {
      throw new ProductionAccessError(
        'Production environment must be read-only for cloning',
        env.id,
        'clone_source_validation'
      )
    }
  }

  public async validateCloneTarget(env: Environment): Promise<void> {
    if (env.type === 'production') {
      throw new ProductionAccessError(
        'Cannot clone TO production environment',
        env.id,
        'clone_target_validation'
      )
    }
  }

  public async validateDatabaseConnection(env: Environment): Promise<void> {
    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      throw new Error(`Invalid database configuration for environment ${env.id}`)
    }
    if (env.supabaseUrl.includes('invalid')) {
      throw new Error(`Cannot connect to database: ${env.supabaseUrl}`)
    }
  }

  public async enforceReadOnlyAccess(env: Environment, operation: string): Promise<void> {
    if (env.type === 'production') {
      throw new ProductionAccessError(
        `Operation '${operation}' is not allowed on production environment`,
        env.id,
        operation
      )
    }
  }

  public async validateSafetyConfig(): Promise<boolean> {
    return true
  }
}

// Mock EnvironmentValidator
export class MockEnvironmentValidator {
  public async validateEnvironment(env: Environment): Promise<EnvironmentValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate basic configuration
    if (!env.supabaseUrl) errors.push('Missing Supabase URL')
    if (!env.supabaseAnonKey) errors.push('Missing Supabase anonymous key')
    if (!env.supabaseServiceKey) errors.push('Missing Supabase service key')

    // Check for invalid configurations
    if (env.supabaseUrl.includes('invalid')) {
      errors.push('Invalid Supabase URL configuration')
    }

    // Production-specific validations
    if (env.type === 'production') {
      if (env.allowWrites !== false) {
        errors.push('Production environment must have allowWrites set to false')
      }
      if (!env.isProduction) {
        warnings.push('Production environment should have isProduction flag set')
      }
    }

    return {
      isValid: errors.length === 0,
      environmentType: env.type,
      isProduction: env.type === 'production',
      allowWrites: env.allowWrites,
      errors,
      warnings,
      safetyChecks: {
        productionProtected: env.type !== 'production' || env.allowWrites === false,
        writeAccessControlled: true,
        connectionValidated: !env.supabaseUrl.includes('invalid')
      }
    }
  }
}

// Mock EnvironmentConfigManager
export class MockEnvironmentConfigManager {
  public async loadEnvironmentConfig(envId: string): Promise<any> {
    return {
      NEXT_PUBLIC_SUPABASE_URL: `https://${envId}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: `${envId}-anon-key`,
      SUPABASE_SERVICE_ROLE_KEY: `${envId}-service-key`,
      ENVIRONMENT_TYPE: envId.includes('prod') ? 'production' : 'test',
      IS_PRODUCTION: envId.includes('prod'),
      ALLOW_WRITES: !envId.includes('prod')
    }
  }

  public async saveEnvironmentConfig(envId: string, config: any): Promise<void> {
    // Mock save operation
  }
}

// Mock Schema Analysis components
export class MockSchemaAnalyzer {
  public async analyzeSchema(env: Environment): Promise<any> {
    return {
      tables: [
        { name: 'users', columns: ['id', 'email', 'name'] },
        { name: 'lofts', columns: ['id', 'name', 'address'] },
        { name: 'transactions', columns: ['id', 'amount', 'date'] },
        { name: 'tasks', columns: ['id', 'title', 'status'] },
        { name: 'reservations', columns: ['id', 'loft_id', 'guest_name'] },
        { name: 'conversations', columns: ['id', 'title', 'created_at'] },
        { name: 'audit_logs', columns: ['id', 'table_name', 'action'] }
      ],
      functions: [
        { name: 'update_bill_due_dates', type: 'function' },
        { name: 'calculate_transaction_alerts', type: 'function' }
      ],
      triggers: [
        { name: 'audit_trigger_transactions', table: 'transactions' },
        { name: 'audit_trigger_tasks', table: 'tasks' },
        { name: 'audit_trigger_reservations', table: 'reservations' },
        { name: 'audit_trigger_lofts', table: 'lofts' }
      ]
    }
  }
}

export class MockSchemaComparator {
  public async compareSchemas(source: any, target: any): Promise<any> {
    return {
      differences: [],
      additions: [],
      modifications: [],
      deletions: []
    }
  }
}

export class MockMigrationGenerator {
  public async generateMigrationScript(diff: any): Promise<any> {
    return {
      script: 'SELECT 1; -- Mock migration script',
      rollbackScript: 'SELECT 1; -- Mock rollback script'
    }
  }
}

// Mock Anonymization components
export class MockAnonymizationOrchestrator {
  public async anonymizeData(data: any[], rules: any[]): Promise<any[]> {
    return data.map(record => ({
      ...record,
      email: record.email ? `user${Math.random().toString(36).substr(2, 9)}@test.local` : record.email,
      name: record.name ? `Test User ${Math.random().toString(36).substr(2, 5)}` : record.name,
      phone: record.phone ? `05${Math.random().toString().substr(2, 8)}` : record.phone
    }))
  }
}

// Mock Progress Tracker
export class MockCloneProgressTracker {
  private operations: Map<string, any> = new Map()

  public initializeOperation(operationId: string, operation: any): void {
    this.operations.set(operationId, { ...operation, progress: 0 })
  }

  public updateProgress(operationId: string, progress: number): void {
    const operation = this.operations.get(operationId)
    if (operation) {
      operation.progress = progress
    }
  }

  public getProgress(operationId: string): number {
    const operation = this.operations.get(operationId)
    return operation ? operation.progress : 0
  }
}

// Mock Backup Manager
export class MockCloneBackupManager {
  private backups: Map<string, any> = new Map()

  public async createBackup(env: Environment, options: any): Promise<string> {
    if (env.type === 'production') {
      throw new ProductionAccessError(
        'Cannot create backup of production environment',
        env.id,
        'backup_creation'
      )
    }

    const backupId = `backup_${env.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const backup = {
      id: backupId,
      environmentId: env.id,
      environmentName: env.name,
      environmentType: env.type,
      createdAt: new Date(),
      size: Math.floor(Math.random() * 1000000), // Random size in bytes
      options,
      isValid: true
    }

    this.backups.set(backupId, backup)
    return backupId
  }

  public async restoreBackup(env: Environment, backupId: string): Promise<void> {
    if (env.type === 'production') {
      throw new ProductionAccessError(
        'Cannot restore backup to production environment',
        env.id,
        'backup_restore'
      )
    }

    const backup = this.backups.get(backupId)
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`)
    }

    if (!backup.isValid) {
      throw new Error(`Backup is corrupted: ${backupId}`)
    }

    // Mock restore operation
  }

  public async getBackupInfo(backupId: string): Promise<any> {
    return this.backups.get(backupId) || null
  }
}

// Setup mocks for jest
export function setupEnvironmentManagementMocks() {
  // Mock the ProductionSafetyGuard module
  jest.doMock('../../../lib/environment-management/production-safety-guard', () => ({
    ProductionSafetyGuard: MockProductionSafetyGuard
  }))

  // Mock the EnvironmentValidator module
  jest.doMock('../../../lib/environment-management/environment-validator', () => ({
    EnvironmentValidator: MockEnvironmentValidator
  }))

  // Mock the EnvironmentConfigManager module
  jest.doMock('../../../lib/environment-management/environment-config-manager', () => ({
    EnvironmentConfigManager: MockEnvironmentConfigManager
  }))

  // Mock the schema analysis modules
  jest.doMock('../../../lib/environment-management/schema-analysis', () => ({
    SchemaAnalyzer: MockSchemaAnalyzer,
    SchemaComparator: MockSchemaComparator,
    MigrationGenerator: MockMigrationGenerator
  }))

  // Mock the anonymization modules
  jest.doMock('../../../lib/environment-management/anonymization', () => ({
    AnonymizationOrchestrator: MockAnonymizationOrchestrator
  }))

  // Mock the progress tracker
  jest.doMock('../../../lib/environment-management/clone-progress-tracker', () => ({
    CloneProgressTracker: MockCloneProgressTracker
  }))

  // Mock the backup manager
  jest.doMock('../../../lib/environment-management/clone-backup-manager', () => ({
    CloneBackupManager: MockCloneBackupManager
  }))
}