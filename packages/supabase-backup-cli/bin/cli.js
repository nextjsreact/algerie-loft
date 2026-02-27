#!/usr/bin/env node

/**
 * Supabase Backup CLI
 * Universal backup and restore tool for Supabase databases
 */

const { Command } = require('commander');
const { createBackup, restoreBackup, cloneBackup, listBackups, verifyBackup, getBackupInfo } = require('../dist/index');
const chalk = require('chalk');
const path = require('path');

const program = new Command();

program
  .name('supabase-backup')
  .description('Complete backup and restore solution for Supabase databases')
  .version('1.0.0');

// CREATE command
program
  .command('create')
  .description('Create a complete backup of your Supabase database and storage')
  .option('-o, --output <path>', 'Output directory', './backups')
  .option('-e, --env <file>', 'Environment file', '.env.local')
  .option('--no-storage', 'Skip storage files backup')
  .option('--compression', 'Enable compression (gzip)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🚀 Creating Supabase backup...\n'));
      
      const result = await createBackup({
        outputDir: path.resolve(options.output),
        envFile: options.env,
        includeStorage: options.storage,
        compression: options.compression,
        verbose: options.verbose
      });

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Backup created successfully!'));
        console.log(chalk.gray(`📁 Location: ${result.backupPath}`));
        console.log(chalk.gray(`📊 Size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.gray(`📦 Files: ${result.fileCount}`));
      } else {
        console.error(chalk.red.bold('\n❌ Backup failed:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// RESTORE command
program
  .command('restore <backup-folder>')
  .description('Restore a backup to a Supabase database')
  .option('-e, --env <file>', 'Environment file', '.env.local')
  .option('--no-storage', 'Skip storage files restoration')
  .option('--sql-only', 'Restore only SQL database')
  .option('--storage-only', 'Restore only storage files')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-v, --verbose', 'Verbose output')
  .action(async (backupFolder, options) => {
    try {
      console.log(chalk.blue.bold('🔄 Restoring Supabase backup...\n'));
      
      const result = await restoreBackup(backupFolder, {
        envFile: options.env,
        includeStorage: options.storage && !options.sqlOnly,
        sqlOnly: options.sqlOnly,
        storageOnly: options.storageOnly,
        skipConfirmation: options.yes,
        verbose: options.verbose
      });

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Restoration completed successfully!'));
      } else {
        console.error(chalk.red.bold('\n❌ Restoration failed:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// CLONE command
program
  .command('clone <backup-folder> <target-env>')
  .description('Clone a backup to another environment')
  .option('--env-file <file>', 'Target environment file (default: .env.<target-env>)')
  .option('--no-storage', 'Skip storage files')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-v, --verbose', 'Verbose output')
  .action(async (backupFolder, targetEnv, options) => {
    try {
      console.log(chalk.blue.bold(`🔀 Cloning backup to ${targetEnv.toUpperCase()} environment...\n`));
      
      const result = await cloneBackup(backupFolder, targetEnv, {
        envFile: options.envFile || `.env.${targetEnv}`,
        includeStorage: options.storage,
        skipConfirmation: options.yes,
        verbose: options.verbose
      });

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Cloning completed successfully!'));
      } else {
        console.error(chalk.red.bold('\n❌ Cloning failed:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// LIST command
program
  .command('list')
  .description('List all available backups')
  .option('-p, --path <path>', 'Backups directory', './backups')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const backups = await listBackups({
        backupsDir: path.resolve(options.path)
      });

      if (options.json) {
        console.log(JSON.stringify(backups, null, 2));
      } else {
        console.log(chalk.blue.bold('📦 Available Backups:\n'));
        
        if (backups.length === 0) {
          console.log(chalk.gray('No backups found.'));
        } else {
          backups.forEach((backup, index) => {
            console.log(chalk.white.bold(`${index + 1}. ${backup.name}`));
            console.log(chalk.gray(`   Created: ${backup.created}`));
            console.log(chalk.gray(`   Size: ${backup.size}`));
            console.log(chalk.gray(`   Files: ${backup.fileCount}`));
            console.log('');
          });
        }
      }
    } catch (error) {
      console.error(chalk.red.bold('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// VERIFY command
program
  .command('verify <backup-folder>')
  .description('Verify backup integrity')
  .option('--checksums', 'Verify file checksums')
  .option('--sql', 'Verify SQL dump syntax')
  .option('-v, --verbose', 'Verbose output')
  .action(async (backupFolder, options) => {
    try {
      console.log(chalk.blue.bold('🔍 Verifying backup...\n'));
      
      const result = await verifyBackup(backupFolder, {
        checkChecksums: options.checksums,
        checkSql: options.sql,
        verbose: options.verbose
      });

      if (result.valid) {
        console.log(chalk.green.bold('\n✅ Backup is valid!'));
        console.log(chalk.gray(`Files checked: ${result.filesChecked}`));
        if (result.checksumMatch !== undefined) {
          console.log(chalk.gray(`Checksums: ${result.checksumMatch ? '✓' : '✗'}`));
        }
      } else {
        console.log(chalk.red.bold('\n❌ Backup verification failed!'));
        console.log(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red.bold('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// INFO command
program
  .command('info <backup-folder>')
  .description('Show detailed information about a backup')
  .action(async (backupFolder) => {
    try {
      const info = await getBackupInfo(backupFolder);

      console.log(chalk.blue.bold('📋 Backup Information:\n'));
      console.log(chalk.white.bold('Name:'), info.name);
      console.log(chalk.white.bold('Created:'), info.created);
      console.log(chalk.white.bold('Type:'), info.type);
      console.log(chalk.white.bold('Size:'), info.size);
      console.log(chalk.white.bold('Files:'), info.fileCount);
      console.log(chalk.white.bold('SQL Dump:'), info.hasSql ? '✓' : '✗');
      console.log(chalk.white.bold('Storage Files:'), info.hasStorage ? '✓' : '✗');
      console.log(chalk.white.bold('Checksums:'), info.hasChecksums ? '✓' : '✗');
      
      if (info.config) {
        console.log(chalk.white.bold('\nConfiguration:'));
        console.log(chalk.gray(`  Project: ${info.config.project_ref || 'Unknown'}`));
        console.log(chalk.gray(`  Timestamp: ${info.config.timestamp || 'Unknown'}`));
      }

      if (info.buckets && info.buckets.length > 0) {
        console.log(chalk.white.bold('\nStorage Buckets:'));
        info.buckets.forEach(bucket => {
          console.log(chalk.gray(`  - ${bucket.name} (${bucket.fileCount} files)`));
        });
      }
    } catch (error) {
      console.error(chalk.red.bold('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
