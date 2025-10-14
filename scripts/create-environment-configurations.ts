/**
 * Environment Configuration Generator
 * 
 * Creates configuration templates for different environments
 * with proper safety settings and environment-specific configurations.
 * 
 * Requirements: 6.4, 10.3
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface EnvironmentTemplate {
  name: string
  type: 'production' | 'test' | 'training' | 'development'
  description: string
  configuration: Record<string, string>
  safetySettings: SafetySettings
  features: FeatureSettings
}

interface SafetySettings {
  isProduction: boolean
  allowWrites: boolean
  requireConfirmation: boolean
  enableAuditLogging: boolean
  enforceReadOnly: boolean
}

interface FeatureSettings {
  anonymizeData: boolean
  includeAuditLogs: boolean
  includeConversations: boolean
  includeReservations: boolean
  preserveUserRoles: boolean
  enableMonitoring: boolean
  enableAlerts: boolean
}

export class EnvironmentConfigurationGenerator {
  private configDir: string
  private templatesDir: string

  constructor() {
    this.configDir = join(process.cwd(), '.kiro', 'environment-cloning', 'configs')
    this.templatesDir = join(process.cwd(), '.kiro', 'environment-cloning', 'templates')
    
    // Ensure directories exist
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true })
    }
    if (!existsSync(this.templatesDir)) {
      mkdirSync(this.templatesDir, { recursive: true })
    }
  }

  /**
   * Generate all environment configurations
   */
  public async generateAllConfigurations(): Promise<void> {
    console.log('🔧 Generating environment configurations...')

    const templates = this.getEnvironmentTemplates()

    for (const template of templates) {
      await this.generateEnvironmentConfiguration(template)
    }

    await this.generateMasterConfiguration()
    await this.generateDeploymentScripts()
    await this.generateDocumentation()

    console.log('✅ All environment configurations generated successfully')
  }

  /**
   * Get environment templates
   */
  private getEnvironmentTemplates(): EnvironmentTemplate[] {
    return [
      {
        name: 'production',
        type: 'production',
        description: 'Production environment - READ ONLY for cloning operations',
        configuration: {
          // Supabase Configuration (placeholders)
          NEXT_PUBLIC_SUPABASE_URL: 'https://your-production-project.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-production-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'your-production-service-key',
          
          // Application Configuration
          NEXT_PUBLIC_APP_URL: 'https://loftalgerie.com',
          NODE_ENV: 'production',
          
          // Environment Type Identification (CRITICAL for safety)
          ENVIRONMENT_TYPE: 'production',
          IS_PRODUCTION: 'true',
          ALLOW_WRITES: 'false', // CRITICAL: Production is always read-only
          
          // Clone-specific Configuration
          CLONE_SOURCE_ENV: '', // Production is never a clone target
          ANONYMIZE_DATA: 'true',
          INCLUDE_AUDIT_LOGS: 'true',
          PRESERVE_USER_ROLES: 'false', // Don't preserve roles when cloning from production
          
          // Security Settings
          ENABLE_PRODUCTION_SAFETY_GUARD: 'true',
          REQUIRE_CONFIRMATION: 'true',
          AUDIT_ALL_OPERATIONS: 'true',
          
          // Performance Settings
          MAX_CONCURRENT_OPERATIONS: '1',
          OPERATION_TIMEOUT: '300000', // 5 minutes
          BATCH_SIZE: '500',
          
          // Monitoring Settings
          ENABLE_MONITORING: 'true',
          ENABLE_ALERTS: 'true',
          LOG_LEVEL: 'info'
        },
        safetySettings: {
          isProduction: true,
          allowWrites: false,
          requireConfirmation: true,
          enableAuditLogging: true,
          enforceReadOnly: true
        },
        features: {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: false,
          enableMonitoring: true,
          enableAlerts: true
        }
      },
      {
        name: 'test',
        type: 'test',
        description: 'Test environment for automated testing and validation',
        configuration: {
          // Supabase Configuration (placeholders)
          NEXT_PUBLIC_SUPABASE_URL: 'https://your-test-project.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-test-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'your-test-service-key',
          
          // Application Configuration
          NEXT_PUBLIC_APP_URL: 'https://test.loftalgerie.com',
          NODE_ENV: 'test',
          
          // Environment Type Identification
          ENVIRONMENT_TYPE: 'test',
          IS_PRODUCTION: 'false',
          ALLOW_WRITES: 'true',
          
          // Clone-specific Configuration
          CLONE_SOURCE_ENV: 'production',
          ANONYMIZE_DATA: 'true',
          INCLUDE_AUDIT_LOGS: 'true',
          PRESERVE_USER_ROLES: 'true', // Preserve roles for testing
          
          // Specialized Systems
          INCLUDE_CONVERSATIONS: 'true',
          INCLUDE_RESERVATIONS: 'true',
          INCLUDE_BILL_NOTIFICATIONS: 'true',
          INCLUDE_TRANSACTION_REFERENCES: 'true',
          
          // Security Settings
          ENABLE_PRODUCTION_SAFETY_GUARD: 'true',
          REQUIRE_CONFIRMATION: 'false', // Less confirmation for automated testing
          AUDIT_ALL_OPERATIONS: 'true',
          
          // Performance Settings
          MAX_CONCURRENT_OPERATIONS: '3',
          OPERATION_TIMEOUT: '600000', // 10 minutes for testing
          BATCH_SIZE: '1000',
          
          // Monitoring Settings
          ENABLE_MONITORING: 'true',
          ENABLE_ALERTS: 'false', // Disable alerts for test environment
          LOG_LEVEL: 'debug'
        },
        safetySettings: {
          isProduction: false,
          allowWrites: true,
          requireConfirmation: false,
          enableAuditLogging: true,
          enforceReadOnly: false
        },
        features: {
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          enableMonitoring: true,
          enableAlerts: false
        }
      },
      {
        name: 'training',
        type: 'training',
        description: 'Training environment with sample data for user training',
        configuration: {
          // Supabase Configuration (placeholders)
          NEXT_PUBLIC_SUPABASE_URL: 'https://your-training-project.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-training-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'your-training-service-key',
          
          // Application Configuration
          NEXT_PUBLIC_APP_URL: 'https://training.loftalgerie.com',
          NODE_ENV: 'development',
          
          // Environment Type Identification
          ENVIRONMENT_TYPE: 'training',
          IS_PRODUCTION: 'false',
          ALLOW_WRITES: 'true',
          
          // Clone-specific Configuration
          CLONE_SOURCE_ENV: 'production',
          ANONYMIZE_DATA: 'true',
          INCLUDE_AUDIT_LOGS: 'false', // Simplified for training
          PRESERVE_USER_ROLES: 'true',
          
          // Specialized Systems
          INCLUDE_CONVERSATIONS: 'true',
          INCLUDE_RESERVATIONS: 'true',
          INCLUDE_BILL_NOTIFICATIONS: 'true',
          INCLUDE_TRANSACTION_REFERENCES: 'false', // Simplified for training
          
          // Training-specific Settings
          GENERATE_SAMPLE_DATA: 'true',
          SAMPLE_DATA_SIZE: 'medium', // small, medium, large
          CREATE_TRAINING_USERS: 'true',
          TRAINING_USER_COUNT: '20',
          
          // Security Settings
          ENABLE_PRODUCTION_SAFETY_GUARD: 'true',
          REQUIRE_CONFIRMATION: 'false',
          AUDIT_ALL_OPERATIONS: 'false', // Simplified for training
          
          // Performance Settings
          MAX_CONCURRENT_OPERATIONS: '2',
          OPERATION_TIMEOUT: '900000', // 15 minutes for training setup
          BATCH_SIZE: '500',
          
          // Monitoring Settings
          ENABLE_MONITORING: 'false', // Simplified for training
          ENABLE_ALERTS: 'false',
          LOG_LEVEL: 'info'
        },
        safetySettings: {
          isProduction: false,
          allowWrites: true,
          requireConfirmation: false,
          enableAuditLogging: false,
          enforceReadOnly: false
        },
        features: {
          anonymizeData: true,
          includeAuditLogs: false,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          enableMonitoring: false,
          enableAlerts: false
        }
      },
      {
        name: 'development',
        type: 'development',
        description: 'Development environment for feature development and testing',
        configuration: {
          // Supabase Configuration (placeholders)
          NEXT_PUBLIC_SUPABASE_URL: 'https://your-dev-project.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-dev-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'your-dev-service-key',
          
          // Application Configuration
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          NODE_ENV: 'development',
          
          // Environment Type Identification
          ENVIRONMENT_TYPE: 'development',
          IS_PRODUCTION: 'false',
          ALLOW_WRITES: 'true',
          
          // Clone-specific Configuration
          CLONE_SOURCE_ENV: 'test', // Clone from test instead of production
          ANONYMIZE_DATA: 'false', // May want real-looking data for development
          INCLUDE_AUDIT_LOGS: 'true',
          PRESERVE_USER_ROLES: 'true',
          
          // Specialized Systems
          INCLUDE_CONVERSATIONS: 'true',
          INCLUDE_RESERVATIONS: 'true',
          INCLUDE_BILL_NOTIFICATIONS: 'true',
          INCLUDE_TRANSACTION_REFERENCES: 'true',
          
          // Development-specific Settings
          ENABLE_DEBUG_MODE: 'true',
          ENABLE_HOT_RELOAD: 'true',
          SKIP_VALIDATIONS: 'false', // Keep validations even in dev
          
          // Security Settings
          ENABLE_PRODUCTION_SAFETY_GUARD: 'true',
          REQUIRE_CONFIRMATION: 'false',
          AUDIT_ALL_OPERATIONS: 'false',
          
          // Performance Settings
          MAX_CONCURRENT_OPERATIONS: '5',
          OPERATION_TIMEOUT: '1800000', // 30 minutes for development
          BATCH_SIZE: '100', // Smaller batches for development
          
          // Monitoring Settings
          ENABLE_MONITORING: 'false',
          ENABLE_ALERTS: 'false',
          LOG_LEVEL: 'debug'
        },
        safetySettings: {
          isProduction: false,
          allowWrites: true,
          requireConfirmation: false,
          enableAuditLogging: false,
          enforceReadOnly: false
        },
        features: {
          anonymizeData: false,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          preserveUserRoles: true,
          enableMonitoring: false,
          enableAlerts: false
        }
      }
    ]
  }

  /**
   * Generate configuration for a specific environment
   */
  private async generateEnvironmentConfiguration(template: EnvironmentTemplate): Promise<void> {
    console.log(`   Generating ${template.name} environment configuration...`)

    // Generate .env file
    const envContent = this.generateEnvFile(template)
    const envPath = join(this.configDir, `.env.${template.name}`)
    writeFileSync(envPath, envContent)

    // Generate JSON configuration
    const jsonConfig = {
      name: template.name,
      type: template.type,
      description: template.description,
      configuration: template.configuration,
      safetySettings: template.safetySettings,
      features: template.features,
      generatedAt: new Date().toISOString()
    }
    const jsonPath = join(this.configDir, `${template.name}.json`)
    writeFileSync(jsonPath, JSON.stringify(jsonConfig, null, 2))

    // Generate environment-specific deployment script
    const deploymentScript = this.generateDeploymentScript(template)
    const scriptPath = join(this.templatesDir, `deploy-${template.name}.sh`)
    writeFileSync(scriptPath, deploymentScript)

    // Generate environment validation script
    const validationScript = this.generateValidationScript(template)
    const validationPath = join(this.templatesDir, `validate-${template.name}.ts`)
    writeFileSync(validationPath, validationScript)

    console.log(`     ✅ Generated configuration for ${template.name}`)
  }

  /**
   * Generate .env file content
   */
  private generateEnvFile(template: EnvironmentTemplate): string {
    const lines: string[] = []
    
    lines.push(`# ${template.description}`)
    lines.push(`# Generated on: ${new Date().toISOString()}`)
    lines.push(`# Environment Type: ${template.type}`)
    lines.push('')
    
    // Add safety warning for production
    if (template.type === 'production') {
      lines.push('# ⚠️  CRITICAL SAFETY WARNING:')
      lines.push('# This is a PRODUCTION environment configuration.')
      lines.push('# Production environments are ALWAYS READ-ONLY for cloning operations.')
      lines.push('# NEVER change ALLOW_WRITES to true for production!')
      lines.push('')
    }
    
    // Group configurations by category
    const categories = {
      'Supabase Configuration': [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ],
      'Application Configuration': [
        'NEXT_PUBLIC_APP_URL',
        'NODE_ENV'
      ],
      'Environment Type Identification': [
        'ENVIRONMENT_TYPE',
        'IS_PRODUCTION',
        'ALLOW_WRITES'
      ],
      'Clone Configuration': [
        'CLONE_SOURCE_ENV',
        'ANONYMIZE_DATA',
        'INCLUDE_AUDIT_LOGS',
        'PRESERVE_USER_ROLES'
      ],
      'Specialized Systems': [
        'INCLUDE_CONVERSATIONS',
        'INCLUDE_RESERVATIONS',
        'INCLUDE_BILL_NOTIFICATIONS',
        'INCLUDE_TRANSACTION_REFERENCES'
      ],
      'Security Settings': [
        'ENABLE_PRODUCTION_SAFETY_GUARD',
        'REQUIRE_CONFIRMATION',
        'AUDIT_ALL_OPERATIONS'
      ],
      'Performance Settings': [
        'MAX_CONCURRENT_OPERATIONS',
        'OPERATION_TIMEOUT',
        'BATCH_SIZE'
      ],
      'Monitoring Settings': [
        'ENABLE_MONITORING',
        'ENABLE_ALERTS',
        'LOG_LEVEL'
      ]
    }

    Object.entries(categories).forEach(([category, keys]) => {
      lines.push(`# ${category}`)
      keys.forEach(key => {
        if (template.configuration[key] !== undefined) {
          lines.push(`${key}=${template.configuration[key]}`)
        }
      })
      lines.push('')
    })

    // Add any remaining configuration keys
    const usedKeys = new Set(Object.values(categories).flat())
    Object.entries(template.configuration).forEach(([key, value]) => {
      if (!usedKeys.has(key)) {
        lines.push(`${key}=${value}`)
      }
    })

    return lines.join('\n')
  }

  /**
   * Generate deployment script for environment
   */
  private generateDeploymentScript(template: EnvironmentTemplate): string {
    return `#!/bin/bash
# Deployment script for ${template.name} environment
# Generated on: ${new Date().toISOString()}

set -e

echo "🚀 Deploying ${template.name} environment..."

# Set environment variables
export NODE_ENV=${template.configuration.NODE_ENV}
export ENVIRONMENT_TYPE=${template.type}

# Copy environment configuration
cp .kiro/environment-cloning/configs/.env.${template.name} .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Run environment-specific setup
echo "⚙️  Running environment setup..."
npx ts-node scripts/setup-${template.name}-environment.ts

# Validate environment
echo "✅ Validating environment..."
npx ts-node .kiro/environment-cloning/templates/validate-${template.name}.ts

echo "✅ ${template.name} environment deployed successfully!"
`
  }

  /**
   * Generate validation script for environment
   */
  private generateValidationScript(template: EnvironmentTemplate): string {
    return `/**
 * ${template.name} Environment Validation Script
 * Generated on: ${new Date().toISOString()}
 */

import { EnvironmentValidator, Environment } from '../../lib/environment-management'

const environment: Environment = {
  id: '${template.name}-001',
  name: '${template.name.charAt(0).toUpperCase() + template.name.slice(1)} Environment',
  type: '${template.type}',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  status: 'active',
  isProduction: ${template.safetySettings.isProduction},
  allowWrites: ${template.safetySettings.allowWrites},
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: '${template.description}'
}

async function validateEnvironment() {
  console.log('🔍 Validating ${template.name} environment...')
  
  const validator = new EnvironmentValidator()
  const result = await validator.validateEnvironment(environment)
  
  if (result.isValid) {
    console.log('✅ Environment validation passed')
    console.log(\`   Environment Type: \${result.environmentType}\`)
    console.log(\`   Production: \${result.isProduction}\`)
    console.log(\`   Allow Writes: \${result.allowWrites}\`)
    
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:')
      result.warnings.forEach(warning => console.log(\`   - \${warning}\`))
    }
  } else {
    console.error('❌ Environment validation failed')
    result.errors.forEach(error => console.error(\`   - \${error}\`))
    process.exit(1)
  }
}

if (require.main === module) {
  validateEnvironment().catch(error => {
    console.error('💥 Validation error:', error.message)
    process.exit(1)
  })
}
`
  }

  /**
   * Generate master configuration file
   */
  private async generateMasterConfiguration(): Promise<void> {
    console.log('   Generating master configuration...')

    const masterConfig = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      environments: {
        production: {
          configFile: '.env.production',
          jsonConfig: 'production.json',
          deploymentScript: 'deploy-production.sh',
          validationScript: 'validate-production.ts',
          description: 'Production environment - READ ONLY for cloning'
        },
        test: {
          configFile: '.env.test',
          jsonConfig: 'test.json',
          deploymentScript: 'deploy-test.sh',
          validationScript: 'validate-test.ts',
          description: 'Test environment for automated testing'
        },
        training: {
          configFile: '.env.training',
          jsonConfig: 'training.json',
          deploymentScript: 'deploy-training.sh',
          validationScript: 'validate-training.ts',
          description: 'Training environment with sample data'
        },
        development: {
          configFile: '.env.development',
          jsonConfig: 'development.json',
          deploymentScript: 'deploy-development.sh',
          validationScript: 'validate-development.ts',
          description: 'Development environment for feature development'
        }
      },
      safetyRules: {
        productionReadOnly: 'Production environments must always have ALLOW_WRITES=false',
        environmentValidation: 'All environments must be validated before use',
        confirmationRequired: 'Production operations require explicit confirmation',
        auditLogging: 'All production access must be logged and audited'
      },
      deploymentOrder: ['development', 'test', 'training', 'production'],
      validationRequired: true
    }

    const masterConfigPath = join(this.configDir, 'master-config.json')
    writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2))

    console.log('     ✅ Master configuration generated')
  }

  /**
   * Generate deployment scripts
   */
  private async generateDeploymentScripts(): Promise<void> {
    console.log('   Generating deployment scripts...')

    // Generate main deployment script
    const mainDeployScript = `#!/bin/bash
# Main deployment script for Environment Cloning System
# Generated on: ${new Date().toISOString()}

set -e

ENVIRONMENT=\${1:-development}
SKIP_VALIDATION=\${2:-false}

echo "🚀 Deploying Environment Cloning System for \$ENVIRONMENT environment..."

# Validate environment parameter
case \$ENVIRONMENT in
  production|test|training|development)
    echo "✅ Valid environment: \$ENVIRONMENT"
    ;;
  *)
    echo "❌ Invalid environment: \$ENVIRONMENT"
    echo "Valid environments: production, test, training, development"
    exit 1
    ;;
esac

# Run environment-specific deployment
if [ -f ".kiro/environment-cloning/templates/deploy-\$ENVIRONMENT.sh" ]; then
  echo "📋 Running \$ENVIRONMENT deployment script..."
  bash .kiro/environment-cloning/templates/deploy-\$ENVIRONMENT.sh
else
  echo "❌ Deployment script not found for \$ENVIRONMENT"
  exit 1
fi

# Run validation unless skipped
if [ "\$SKIP_VALIDATION" != "true" ]; then
  echo "🔍 Running post-deployment validation..."
  npx ts-node .kiro/environment-cloning/templates/validate-\$ENVIRONMENT.ts
fi

echo "🎉 Deployment completed successfully for \$ENVIRONMENT environment!"
`

    const mainScriptPath = join(this.templatesDir, 'deploy-main.sh')
    writeFileSync(mainScriptPath, mainDeployScript)

    // Generate environment switching script
    const switchScript = `#!/bin/bash
# Environment switching script
# Generated on: ${new Date().toISOString()}

set -e

TARGET_ENV=\${1}
BACKUP_CURRENT=\${2:-true}

if [ -z "\$TARGET_ENV" ]; then
  echo "❌ Usage: \$0 <environment> [backup_current]"
  echo "Available environments: production, test, training, development"
  exit 1
fi

echo "🔄 Switching to \$TARGET_ENV environment..."

# Backup current environment if requested
if [ "\$BACKUP_CURRENT" = "true" ] && [ -f ".env" ]; then
  BACKUP_NAME=".env.backup.\$(date +%Y%m%d_%H%M%S)"
  cp .env "\$BACKUP_NAME"
  echo "💾 Current environment backed up to \$BACKUP_NAME"
fi

# Switch to target environment
if [ -f ".kiro/environment-cloning/configs/.env.\$TARGET_ENV" ]; then
  cp ".kiro/environment-cloning/configs/.env.\$TARGET_ENV" .env
  echo "✅ Switched to \$TARGET_ENV environment"
  
  # Display current environment info
  echo "📋 Current environment configuration:"
  echo "   Environment Type: \$(grep ENVIRONMENT_TYPE .env | cut -d'=' -f2)"
  echo "   Is Production: \$(grep IS_PRODUCTION .env | cut -d'=' -f2)"
  echo "   Allow Writes: \$(grep ALLOW_WRITES .env | cut -d'=' -f2)"
else
  echo "❌ Configuration file not found for \$TARGET_ENV environment"
  exit 1
fi
`

    const switchScriptPath = join(this.templatesDir, 'switch-environment.sh')
    writeFileSync(switchScriptPath, switchScript)

    console.log('     ✅ Deployment scripts generated')
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(): Promise<void> {
    console.log('   Generating documentation...')

    const documentation = `# Environment Configuration Documentation

Generated on: ${new Date().toISOString()}

## Overview

This directory contains configuration templates and deployment scripts for the Environment Cloning System. Each environment has specific configurations optimized for its intended use case.

## Environments

### Production Environment
- **Purpose**: Source environment for cloning operations
- **Safety**: READ-ONLY access enforced
- **Configuration**: \`.env.production\`
- **Key Features**:
  - Production safety guards enabled
  - All operations audited
  - Confirmation required for all operations
  - Monitoring and alerting enabled

### Test Environment
- **Purpose**: Automated testing and validation
- **Safety**: Write access allowed
- **Configuration**: \`.env.test\`
- **Key Features**:
  - Full anonymization enabled
  - All specialized systems included
  - Debug logging enabled
  - Monitoring enabled, alerts disabled

### Training Environment
- **Purpose**: User training with sample data
- **Safety**: Write access allowed
- **Configuration**: \`.env.training\`
- **Key Features**:
  - Sample data generation
  - Training users created
  - Simplified configuration
  - Monitoring disabled for simplicity

### Development Environment
- **Purpose**: Feature development and testing
- **Safety**: Write access allowed
- **Configuration**: \`.env.development\`
- **Key Features**:
  - Debug mode enabled
  - Hot reload support
  - Detailed logging
  - Flexible configuration

## Deployment

### Quick Start
\`\`\`bash
# Deploy to development environment
./deploy-main.sh development

# Deploy to test environment
./deploy-main.sh test

# Deploy to production environment (requires confirmation)
./deploy-main.sh production
\`\`\`

### Environment Switching
\`\`\`bash
# Switch to test environment
./switch-environment.sh test

# Switch to production environment (with backup)
./switch-environment.sh production true
\`\`\`

## Safety Rules

### Production Safety
1. **NEVER** set \`ALLOW_WRITES=true\` for production
2. **ALWAYS** require confirmation for production operations
3. **ALWAYS** audit all production access
4. **NEVER** use production as a clone target

### Environment Validation
1. All environments must be validated before use
2. Configuration files must match environment type
3. Safety settings must be appropriate for environment type
4. Database connections must be verified

## Configuration Files

- \`master-config.json\`: Master configuration with all environments
- \`.env.{environment}\`: Environment-specific configuration
- \`{environment}.json\`: Structured configuration data
- \`deploy-{environment}.sh\`: Environment-specific deployment script
- \`validate-{environment}.ts\`: Environment validation script

## Monitoring and Alerting

### Production
- Full monitoring enabled
- Critical alerts for all failures
- Performance metrics collection
- Health checks every 30 seconds

### Test
- Monitoring enabled
- Alerts disabled (to avoid noise)
- Debug logging enabled
- Extended timeouts for testing

### Training
- Monitoring disabled (simplified)
- No alerts
- Basic logging
- Focus on user experience

### Development
- No monitoring (local development)
- Debug logging enabled
- Extended timeouts
- Flexible configuration

## Troubleshooting

### Common Issues

1. **Environment validation fails**
   - Check configuration file exists
   - Verify environment variables are set
   - Ensure database connectivity

2. **Production access blocked**
   - Verify \`ALLOW_WRITES=false\` for production
   - Check production safety guard configuration
   - Ensure proper confirmation flow

3. **Deployment fails**
   - Check dependencies are installed
   - Verify file permissions
   - Review deployment logs

### Support

For issues or questions, refer to:
- System logs in \`logs/deployment/\`
- Health check results
- Environment validation output
- Master configuration documentation
`

    const docPath = join(this.templatesDir, 'README.md')
    writeFileSync(docPath, documentation)

    console.log('     ✅ Documentation generated')
  }
}

// CLI interface
if (require.main === module) {
  const generator = new EnvironmentConfigurationGenerator()
  
  generator.generateAllConfigurations()
    .then(() => {
      console.log('🎉 Environment configuration generation completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Configuration generation failed:', error.message)
      process.exit(1)
    })
}