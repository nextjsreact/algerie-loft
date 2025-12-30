#!/usr/bin/env node

/**
 * Environment Management CLI
 * 
 * Command-line interface for managing test and training environments
 * with production safety guards and interactive confirmations.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { EnvironmentCLI } from './environment-cli';
import { SwitchCommand } from './switch-command';
import { ProductionSafetyGuard } from '../core/production-safety-guard';
import { logger } from '../../logger';

const program = new Command();
const cli = new EnvironmentCLI();
const switchCommand = new SwitchCommand();
const safetyGuard = new ProductionSafetyGuard();

// Display production safety warning
function displaySafetyWarning() {
  console.log(chalk.red.bold('\n⚠️  PRODUCTION SAFETY WARNING ⚠️'));
  console.log(chalk.yellow('This tool manages environment cloning and switching.'));
  console.log(chalk.yellow('Production environment is ALWAYS READ-ONLY.'));
  console.log(chalk.yellow('Any write operations to production are BLOCKED.\n'));
}

// Display current environment status
async function displayEnvironmentStatus() {
  try {
    const currentEnv = await cli.getCurrentEnvironment();
    const status = await cli.getEnvironmentStatus(currentEnv.name);
    
    console.log(chalk.blue('\n📊 Current Environment Status:'));
    console.log(`Environment: ${chalk.green(currentEnv.name)} (${currentEnv.type})`);
    console.log(`Status: ${status.isHealthy ? chalk.green('Healthy') : chalk.red('Issues Detected')}`);
    console.log(`Database: ${currentEnv.supabaseUrl}`);
    
    if (currentEnv.type === 'production') {
      console.log(chalk.red('🔒 PRODUCTION - READ-ONLY ACCESS ONLY'));
    }
    console.log('');
  } catch (error) {
    console.log(chalk.red('❌ Could not determine current environment status'));
    logger.error('Environment status error:', error);
  }
}

program
  .name('env-manager')
  .description('Environment Management CLI for Test/Training Environment Setup')
  .version('1.0.0')
  .hook('preAction', async () => {
    displaySafetyWarning();
    await displayEnvironmentStatus();
  });

// Clone command with production safety
program
  .command('clone')
  .description('Clone an environment with data anonymization')
  .option('-s, --source <env>', 'Source environment name')
  .option('-t, --target <env>', 'Target environment name')
  .option('--anonymize', 'Anonymize sensitive data (default: true)', true)
  .option('--include-audit', 'Include audit logs', true)
  .option('--include-conversations', 'Include conversations', true)
  .option('--include-reservations', 'Include reservations', true)
  .option('--dry-run', 'Perform a dry run without actual cloning')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔄 Starting Environment Clone Operation\n'));
      
      // Production safety checks
      if (options.source === 'production') {
        console.log(chalk.yellow('⚠️  Cloning FROM production environment'));
        console.log(chalk.yellow('Production will be accessed in READ-ONLY mode only.\n'));
      }
      
      if (options.target === 'production') {
        console.log(chalk.red('❌ BLOCKED: Cannot clone TO production environment'));
        console.log(chalk.red('Production environment is protected from write operations.\n'));
        process.exit(1);
      }

      // Interactive confirmation for production source
      if (options.source === 'production') {
        const { confirmProduction } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmProduction',
            message: chalk.yellow('⚠️  Confirm: Clone FROM production (read-only access)?'),
            default: false
          }
        ]);

        if (!confirmProduction) {
          console.log(chalk.yellow('Operation cancelled by user.'));
          process.exit(0);
        }

        // Additional safety confirmation
        const { confirmSafety } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmSafety',
            message: chalk.red('⚠️  FINAL CONFIRMATION: I understand production is READ-ONLY and will not be modified'),
            default: false
          }
        ]);

        if (!confirmSafety) {
          console.log(chalk.red('Safety confirmation required. Operation cancelled.'));
          process.exit(0);
        }
      }

      // Validate environments exist
      await cli.validateEnvironmentExists(options.source);
      
      // Final operation confirmation
      const { confirmOperation } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmOperation',
          message: `Proceed with cloning ${chalk.cyan(options.source)} → ${chalk.cyan(options.target)}?`,
          default: false
        }
      ]);

      if (!confirmOperation) {
        console.log(chalk.yellow('Operation cancelled by user.'));
        process.exit(0);
      }

      // Execute clone operation
      const result = await cli.cloneEnvironment({
        source: options.source,
        target: options.target,
        anonymizeData: options.anonymize,
        includeAuditLogs: options.includeAudit,
        includeConversations: options.includeConversations,
        includeReservations: options.includeReservations,
        dryRun: options.dryRun
      });

      if (result.success) {
        console.log(chalk.green('\n✅ Clone operation completed successfully!'));
        console.log(`Operation ID: ${result.operationId}`);
        console.log(`Duration: ${result.duration}ms`);
        console.log(`Tables cloned: ${result.statistics.tablesCloned}`);
        console.log(`Records cloned: ${result.statistics.recordsCloned}`);
        console.log(`Records anonymized: ${result.statistics.recordsAnonymized}`);
      } else {
        console.log(chalk.red('\n❌ Clone operation failed'));
        console.log(`Error: ${result.error}`);
        process.exit(1);
      }

    } catch (error) {
      console.log(chalk.red('\n❌ Clone operation failed with error:'));
      console.log(chalk.red(error.message));
      logger.error('Clone command error:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate environment health and functionality')
  .argument('[environment]', 'Environment name to validate (default: current)')
  .option('--full', 'Run full validation including functionality tests')
  .option('--report', 'Generate detailed validation report')
  .action(async (environment, options) => {
    try {
      console.log(chalk.blue('\n🔍 Starting Environment Validation\n'));
      
      const targetEnv = environment || (await cli.getCurrentEnvironment()).name;
      
      console.log(`Validating environment: ${chalk.cyan(targetEnv)}`);
      
      const result = await cli.validateEnvironment({
        environment: targetEnv,
        fullValidation: options.full,
        generateReport: options.report
      });

      if (result.isValid) {
        console.log(chalk.green('\n✅ Environment validation passed!'));
        console.log(`Health Score: ${result.healthScore}/100`);
        console.log(`Tests Passed: ${result.testsPassedCount}/${result.totalTestsCount}`);
      } else {
        console.log(chalk.red('\n❌ Environment validation failed'));
        console.log(`Errors: ${result.errors.length}`);
        console.log(`Warnings: ${result.warnings.length}`);
        
        if (result.errors.length > 0) {
          console.log(chalk.red('\nErrors:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  • ${error.message}`));
          });
        }
      }

      if (options.report && result.reportPath) {
        console.log(chalk.blue(`\n📄 Detailed report saved to: ${result.reportPath}`));
      }

    } catch (error) {
      console.log(chalk.red('\n❌ Validation failed with error:'));
      console.log(chalk.red(error.message));
      logger.error('Validate command error:', error);
      process.exit(1);
    }
  });

// Switch command with enhanced functionality
program
  .command('switch')
  .description('Switch to a different environment')
  .argument('[environment]', 'Target environment name (interactive if not provided)')
  .option('--backup', 'Backup current configuration before switching', true)
  .option('--restart', 'Restart services after switching', true)
  .option('--force', 'Skip confirmation prompts', false)
  .action(async (environment, options) => {
    try {
      await switchCommand.execute({
        target: environment,
        backup: options.backup,
        restart: options.restart,
        force: options.force,
        interactive: !environment
      });
    } catch (error) {
      console.log(chalk.red('\n❌ Switch failed with error:'));
      console.log(chalk.red(error.message));
      logger.error('Switch command error:', error);
      process.exit(1);
    }
  });

// Quick switch commands
program
  .command('switch-dev')
  .description('Quick switch to development environment')
  .action(async () => {
    try {
      await switchCommand.switchToDevelopment();
    } catch (error) {
      console.log(chalk.red('❌ Switch to development failed:', error.message));
      process.exit(1);
    }
  });

program
  .command('switch-test')
  .description('Quick switch to test environment')
  .action(async () => {
    try {
      await switchCommand.switchToTest();
    } catch (error) {
      console.log(chalk.red('❌ Switch to test failed:', error.message));
      process.exit(1);
    }
  });

program
  .command('switch-training')
  .description('Quick switch to training environment')
  .action(async () => {
    try {
      await switchCommand.switchToTraining();
    } catch (error) {
      console.log(chalk.red('❌ Switch to training failed:', error.message));
      process.exit(1);
    }
  });

program
  .command('switch-prod')
  .description('Switch to production environment (with extra safety)')
  .action(async () => {
    try {
      await switchCommand.switchToProduction();
    } catch (error) {
      console.log(chalk.red('❌ Switch to production failed:', error.message));
      process.exit(1);
    }
  });

// Reset command with safety confirmations
program
  .command('reset')
  .description('Reset environment to initial state')
  .argument('<environment>', 'Environment name to reset')
  .option('--backup', 'Create backup before reset', true)
  .option('--force', 'Skip confirmation prompts', false)
  .action(async (environment, options) => {
    try {
      console.log(chalk.blue('\n🔄 Starting Environment Reset\n'));
      
      // Production protection
      if (environment === 'production') {
        console.log(chalk.red('❌ BLOCKED: Cannot reset production environment'));
        console.log(chalk.red('Production environment is protected from modifications.\n'));
        process.exit(1);
      }

      // Validate environment exists
      await cli.validateEnvironmentExists(environment);

      if (!options.force) {
        // Warning about data loss
        console.log(chalk.red('⚠️  WARNING: This will DELETE ALL DATA in the target environment'));
        console.log(chalk.red('This action cannot be undone without a backup.\n'));

        const { confirmReset } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmReset',
            message: chalk.red(`⚠️  Confirm: RESET environment ${chalk.cyan(environment)} (ALL DATA WILL BE LOST)?`),
            default: false
          }
        ]);

        if (!confirmReset) {
          console.log(chalk.yellow('Reset cancelled by user.'));
          process.exit(0);
        }

        // Final safety confirmation
        const { confirmFinal } = await inquirer.prompt([
          {
            type: 'input',
            name: 'confirmFinal',
            message: `Type "${environment}" to confirm reset:`,
            validate: (input) => input === environment || 'Environment name does not match'
          }
        ]);
      }

      // Execute reset
      const result = await cli.resetEnvironment({
        environment,
        createBackup: options.backup
      });

      if (result.success) {
        console.log(chalk.green('\n✅ Environment reset completed successfully!'));
        console.log(`Environment: ${chalk.cyan(environment)}`);
        
        if (result.backupPath) {
          console.log(`Backup created at: ${result.backupPath}`);
        }
      } else {
        console.log(chalk.red('\n❌ Environment reset failed'));
        console.log(`Error: ${result.error}`);
        process.exit(1);
      }

    } catch (error) {
      console.log(chalk.red('\n❌ Reset failed with error:'));
      console.log(chalk.red(error.message));
      logger.error('Reset command error:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show current environment status and health')
  .option('--all', 'Show status for all environments')
  .action(async (options) => {
    try {
      if (options.all) {
        const environments = await cli.listEnvironments();
        
        console.log(chalk.blue('\n📊 All Environments Status:\n'));
        
        for (const env of environments) {
          const status = await cli.getEnvironmentStatus(env.name);
          const healthIcon = status.isHealthy ? '✅' : '❌';
          const typeColor = env.type === 'production' ? chalk.red : 
                           env.type === 'test' ? chalk.yellow : chalk.green;
          
          console.log(`${healthIcon} ${typeColor(env.name)} (${env.type})`);
          console.log(`   Database: ${env.supabaseUrl}`);
          console.log(`   Status: ${status.isHealthy ? 'Healthy' : 'Issues'}`);
          console.log(`   Last Updated: ${env.lastUpdated.toLocaleString()}\n`);
        }
      } else {
        await displayEnvironmentStatus();
      }
    } catch (error) {
      console.log(chalk.red('\n❌ Status check failed:'));
      console.log(chalk.red(error.message));
      logger.error('Status command error:', error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List all available environments')
  .action(async () => {
    try {
      const environments = await cli.listEnvironments();
      
      console.log(chalk.blue('\n📋 Available Environments:\n'));
      
      environments.forEach(env => {
        const typeColor = env.type === 'production' ? chalk.red : 
                         env.type === 'test' ? chalk.yellow : chalk.green;
        const statusIcon = env.status === 'active' ? '🟢' : 
                          env.status === 'cloning' ? '🟡' : '🔴';
        
        console.log(`${statusIcon} ${typeColor(env.name)} (${env.type})`);
        console.log(`   ID: ${env.id}`);
        console.log(`   Status: ${env.status}`);
        console.log(`   Created: ${env.createdAt.toLocaleString()}\n`);
      });
    } catch (error) {
      console.log(chalk.red('\n❌ List failed:'));
      console.log(chalk.red(error.message));
      logger.error('List command error:', error);
      process.exit(1);
    }
  });

// Help command with production safety information
program
  .command('help-safety')
  .description('Show production safety information and guidelines')
  .action(() => {
    console.log(chalk.blue('\n🛡️  PRODUCTION SAFETY GUIDELINES\n'));
    
    console.log(chalk.red('CRITICAL SAFETY RULES:'));
    console.log('1. Production is ALWAYS read-only for cloning operations');
    console.log('2. NO write operations are allowed to production');
    console.log('3. All production access is automatically monitored');
    console.log('4. Multiple confirmations required for production operations');
    console.log('5. Automatic blocking of dangerous operations\n');
    
    console.log(chalk.yellow('SAFE OPERATIONS:'));
    console.log('✅ Clone FROM production (read-only)');
    console.log('✅ Validate production (read-only)');
    console.log('✅ Switch TO production (read-only mode)\n');
    
    console.log(chalk.red('BLOCKED OPERATIONS:'));
    console.log('❌ Clone TO production');
    console.log('❌ Reset production');
    console.log('❌ Any write operation to production\n');
    
    console.log(chalk.blue('EMERGENCY PROCEDURES:'));
    console.log('• All operations are logged and monitored');
    console.log('• Automatic rollback on errors');
    console.log('• Emergency stop mechanisms in place');
    console.log('• Admin alerts for security incidents\n');
  });

// Error handling
program.on('command:*', () => {
  console.log(chalk.red(`\n❌ Unknown command: ${program.args.join(' ')}`));
  console.log('Run "env-manager --help" for available commands.\n');
  process.exit(1);
});

// Parse command line arguments
if (process.argv.length === 2) {
  program.help();
}

program.parse();