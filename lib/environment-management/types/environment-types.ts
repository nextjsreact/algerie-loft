/**
 * Environment Management Type Definitions
 * 
 * Core type definitions for the environment management system
 * including safety guards and operation tracking.
 */

export interface Environment {
  id: string;
  name: string;
  type: 'production' | 'test' | 'training' | 'development';
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  databaseUrl: string;
  status: 'active' | 'inactive' | 'cloning' | 'error';
  createdAt: Date;
  lastUpdated: Date;
  isReadOnly?: boolean;
  safetyLevel?: 'high' | 'medium' | 'low';
}

export interface CloneOptions {
  anonymizeData: boolean;
  includeAuditLogs: boolean;
  includeConversations: boolean;
  includeReservations: boolean;
  preserveUserRoles: boolean;
  customAnonymizationRules?: AnonymizationRule[];
  dryRun?: boolean;
  backupBeforeClone?: boolean;
}

export interface CloneResult {
  success: boolean;
  operationId: string | null;
  error?: string;
  duration: number;
  statistics: CloneStatistics;
  backupPath?: string;
  reportPath?: string;
}

export interface CloneStatistics {
  tablesCloned: number;
  recordsCloned: number;
  recordsAnonymized: number;
  functionsCloned: number;
  triggersCloned: number;
  totalSizeCloned: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: EnvironmentStatistics;
}

export interface ValidationError {
  type: 'connection' | 'schema' | 'data' | 'security' | 'configuration';
  message: string;
  details?: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  type: 'performance' | 'configuration' | 'data' | 'security';
  message: string;
  details?: any;
  recommendation?: string;
}

export interface EnvironmentStatistics {
  totalTables: number;
  totalRecords: number;
  totalFunctions: number;
  totalTriggers: number;
  totalPolicies: number;
  databaseSize: string;
  lastBackup?: Date;
}

export interface EnvironmentStatus {
  name: string;
  isHealthy: boolean;
  lastChecked: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  component?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface SwitchResult {
  success: boolean;
  error?: string;
  targetEnvironment: string;
  backupPath?: string;
  servicesRestarted?: boolean;
}

export interface ResetResult {
  success: boolean;
  error?: string;
  environment: string;
  backupPath?: string;
}

export interface AnonymizationRule {
  tableName: string;
  columnName: string;
  anonymizationType: 'email' | 'name' | 'phone' | 'address' | 'custom';
  customGenerator?: (originalValue: any) => any;
  preserveFormat?: boolean;
  preserveLength?: boolean;
}

export interface CloneOperation {
  id: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  logs: CloneLog[];
  statistics: CloneStatistics;
  options: CloneOptions;
  safetyChecks: SafetyCheckResult[];
}

export interface CloneLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  component: string;
  message: string;
  metadata?: any;
}

export interface SafetyCheckResult {
  checkType: 'production_protection' | 'environment_validation' | 'permission_check' | 'backup_verification';
  passed: boolean;
  message: string;
  timestamp: Date;
  details?: any;
}

export interface EnvironmentConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'production' | 'test' | 'development';
  
  // Clone-specific Configuration
  CLONE_SOURCE_ENV?: string;
  ANONYMIZE_DATA?: boolean;
  INCLUDE_AUDIT_LOGS?: boolean;
  PRESERVE_USER_ROLES?: boolean;
  
  // Safety Configuration
  PRODUCTION_READ_ONLY?: boolean;
  SAFETY_CHECKS_ENABLED?: boolean;
  BACKUP_BEFORE_OPERATIONS?: boolean;
}

export interface SchemaDefinition {
  tables: TableDefinition[];
  functions: FunctionDefinition[];
  triggers: TriggerDefinition[];
  indexes: IndexDefinition[];
  policies: PolicyDefinition[];
  schemas: string[];
}

export interface TableDefinition {
  name: string;
  schema: string;
  columns: ColumnDefinition[];
  constraints: ConstraintDefinition[];
  indexes: string[];
  rowCount?: number;
}

export interface ColumnDefinition {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface ConstraintDefinition {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface FunctionDefinition {
  name: string;
  schema: string;
  returnType: string;
  parameters: ParameterDefinition[];
  body: string;
  language: string;
}

export interface ParameterDefinition {
  name: string;
  dataType: string;
  mode: 'IN' | 'OUT' | 'INOUT';
}

export interface TriggerDefinition {
  name: string;
  table: string;
  schema: string;
  event: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  functionName: string;
}

export interface IndexDefinition {
  name: string;
  table: string;
  schema: string;
  columns: string[];
  isUnique: boolean;
  method: string;
}

export interface PolicyDefinition {
  name: string;
  table: string;
  schema: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  expression: string;
}

export interface SchemaDiff {
  tablesAdded: TableDefinition[];
  tablesRemoved: TableDefinition[];
  tablesModified: TableModification[];
  functionsAdded: FunctionDefinition[];
  functionsRemoved: FunctionDefinition[];
  functionsModified: FunctionModification[];
  triggersAdded: TriggerDefinition[];
  triggersRemoved: TriggerDefinition[];
  indexesAdded: IndexDefinition[];
  indexesRemoved: IndexDefinition[];
  policiesAdded: PolicyDefinition[];
  policiesRemoved: PolicyDefinition[];
}

export interface TableModification {
  tableName: string;
  columnsAdded: ColumnDefinition[];
  columnsRemoved: ColumnDefinition[];
  columnsModified: ColumnModification[];
  constraintsAdded: ConstraintDefinition[];
  constraintsRemoved: ConstraintDefinition[];
}

export interface ColumnModification {
  columnName: string;
  oldDefinition: ColumnDefinition;
  newDefinition: ColumnDefinition;
  changes: string[];
}

export interface FunctionModification {
  functionName: string;
  oldDefinition: FunctionDefinition;
  newDefinition: FunctionDefinition;
  changes: string[];
}

export interface MigrationScript {
  id: string;
  name: string;
  description: string;
  upScript: string;
  downScript: string;
  dependencies: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BackupInfo {
  id: string;
  environment: string;
  timestamp: Date;
  size: string;
  path: string;
  type: 'full' | 'schema' | 'data';
  compression: boolean;
  encrypted: boolean;
  metadata: {
    tables: number;
    records: number;
    functions: number;
    triggers: number;
  };
}

export interface RestoreOptions {
  backupId: string;
  targetEnvironment: string;
  restoreSchema: boolean;
  restoreData: boolean;
  restoreFunctions: boolean;
  restoreTriggers: boolean;
  verifyIntegrity: boolean;
}

export interface HealthReport {
  environment: string;
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  metrics: HealthMetrics;
  recommendations: string[];
  issues?: HealthIssue[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  metrics?: any;
  issues?: HealthIssue[];
}

export interface HealthMetrics {
  databaseConnectivity: number;
  queryPerformance: number;
  dataIntegrity: number;
  securityCompliance: number;
  resourceUtilization: number;
}

export interface TestSuite {
  name: string;
  tests: Test[];
  environment: Environment;
  runInParallel: boolean;
}

export interface Test {
  name: string;
  type: 'connectivity' | 'functionality' | 'data_integrity' | 'performance' | 'security';
  execute: (environment: Environment) => Promise<TestResult>;
  timeout: number;
  retries: number;
  dependencies?: string[];
}

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  message?: string;
  details?: any;
  metrics?: any;
}

export type EnvironmentType = 'production' | 'test' | 'training' | 'development';
export type OperationType = 'clone' | 'validate' | 'switch' | 'reset' | 'backup' | 'restore';
export type SafetyLevel = 'high' | 'medium' | 'low';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';