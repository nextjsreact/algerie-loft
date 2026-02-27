/**
 * Type definitions for Supabase Backup CLI
 */

export interface BackupOptions {
  outputDir: string;
  envFile: string;
  includeStorage: boolean;
  compression?: boolean;
  verbose?: boolean;
}

export interface RestoreOptions {
  envFile: string;
  includeStorage: boolean;
  sqlOnly?: boolean;
  storageOnly?: boolean;
  skipConfirmation?: boolean;
  verbose?: boolean;
}

export interface CloneOptions {
  envFile: string;
  includeStorage: boolean;
  skipConfirmation?: boolean;
  verbose?: boolean;
}

export interface ListOptions {
  backupsDir: string;
}

export interface VerifyOptions {
  checkChecksums?: boolean;
  checkSql?: boolean;
  verbose?: boolean;
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  totalSize?: number;
  fileCount?: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
}

export interface CloneResult {
  success: boolean;
  error?: string;
}

export interface BackupInfo {
  name: string;
  path: string;
  created: string;
  type: string;
  size: string;
  fileCount: number;
  hasSql: boolean;
  hasStorage: boolean;
  hasChecksums: boolean;
  config?: BackupConfig;
  buckets?: BucketInfo[];
}

export interface BackupConfig {
  timestamp: string;
  project_ref: string;
  database_url: string;
  backup_type: string;
  includes: {
    sql_dump: boolean;
    storage_files: boolean;
    configuration: boolean;
  };
}

export interface BucketInfo {
  name: string;
  fileCount: number;
}

export interface VerifyResult {
  valid: boolean;
  filesChecked: number;
  checksumMatch?: boolean;
  error?: string;
}

export interface SupabaseCredentials {
  url: string;
  password: string;
  serviceKey: string;
  projectRef: string;
}
