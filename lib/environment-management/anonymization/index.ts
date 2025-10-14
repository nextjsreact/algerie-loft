/**
 * Main exports for the anonymization system
 */

// Core components
export { CoreAnonymizationEngine } from './core-engine';
export { FakeDataGenerator } from './fake-data-generator';
export { RelationshipManager } from './relationship-manager';
export { AnonymizationOrchestrator } from './anonymization-orchestrator';

// Types
export type {
  AnonymizationType,
  DataType,
  AnonymizationRule,
  AnonymizationContext,
  AnonymizationResult,
  AnonymizationReport
} from './types';

export type {
  ForeignKeyRelationship,
  RelationshipMapping,
  RelationalData
} from './relationship-manager';

export type {
  AnonymizationConfig,
  AnonymizationResult as OrchestrationResult
} from './anonymization-orchestrator';

export type {
  FakeDataOptions
} from './fake-data-generator';

// Anonymizers
export * from './anonymizers';