/**
 * Types and interfaces for the data anonymization system
 */

export type AnonymizationType = 
  | 'email' 
  | 'name' 
  | 'phone' 
  | 'address' 
  | 'financial' 
  | 'custom';

export type DataType = 
  | 'string' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'json' 
  | 'uuid';

export interface AnonymizationRule {
  tableName: string;
  columnName: string;
  anonymizationType: AnonymizationType;
  customGenerator?: (originalValue: any) => any;
  preserveFormat?: boolean;
  preserveLength?: boolean;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    range?: { min: number; max: number };
  };
}

export interface AnonymizationContext {
  tableName: string;
  columnName: string;
  originalValue: any;
  rowData: Record<string, any>;
  preserveRelationships: boolean;
}

export interface AnonymizationResult {
  anonymizedValue: any;
  wasAnonymized: boolean;
  preservedFormat: boolean;
  metadata?: Record<string, any>;
}

export interface AnonymizationReport {
  tableName: string;
  originalRecords: number;
  anonymizedRecords: number;
  anonymizedFields: string[];
  preservedRelationships: number;
  generatedFakeData: number;
  errors: string[];
}