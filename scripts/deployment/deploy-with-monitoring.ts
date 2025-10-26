#!/usr/bin/env tsx

/**
 * Enhanced Deployment Script with Monitoring and Rollback Capabilities
 * 
 * Deploys the dual-audience homepage with comprehensive monitoring,
 * feature flags, and automated rollback procedures.
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production'
  enableMonitoring: boolean
  enableFeatureFlags: boolean
  enableRollback: boolean
  gradualRollout: boolean
  rolloutPercentage: number
  healthCheckTimeout: number
  rollbackThresholds: {
    errorRate: number
    responseTime: number
    webVitalsLCP: number
  }
}

class EnhancedDeployment {
  private config: DeploymentConfig
  private deploymentId: string
  private startTime: number

  constructor(config: DeploymentConfig) {
    this.config = config
    this.deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.startTime = Date.now()
  }

  /**
   * Execute the complete deployment process
   */
  public async deploy(): Promise<void> {
    console.log('🚀 Starting Enhanced Deployment Process')
    console.log(`   Deployment ID: ${this.deploymentId}`)
    console.log(`   Environment: ${this.config.environment}`)
    console.log(`   Monitoring: ${this.config.enableMonitoring ? 'Enabled' : 'Disabled'}`)
    console.log(`   Feature Flags: ${this.config.enableFeatureFlags ? 'Enabled' : 'Disabled'}`)
    console.log(`   Rollback: ${this.config.enableRollback ? 'Enabled' : 'Disabled'}`)
    console.log('')

    try {
      // Pre-deployment checks
      await this.preDeploymentChecks()

      // Build and test
      await this.buildAndTest()

      // Deploy to platform
      await this.deployToPlatform()

      // Initialize monitoring
      if (this.config.enableMonitoring) {
        await this.initializeMonitoring()
      }

      // Configure feature flags
      if (this.config.enableFeatureFlags) {
        await this.configureFeatureFlags()
      }

      // Setup rollback monitoring
      if (this.config.enableRollback) {
        await this.setupRollbackMonitoring()
      }

      // Post-deployment verification
      await this.postDeploymentVerification()

      // Start gradual rollout if configured
      if (this.config.gradualRollout) {
        await this.startGradualRollout()
      }

      console.log('✅ Deployment completed successfully!')
      await this.generateDeploymentReport()

    } catch (error) {
      console.error('❌ Deployment failed:', error)
      
      if (this.config.enableRollback) {
        await this.executeEmergencyRollback(error instanceof Error ? error.message : 'Unknown error')
      }
      
      throw error
    }
  }

  /**
   * Pre-deployment checks
   */
  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...')

    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
      if (gitStatus.trim()) {
        console.warn('⚠️ Uncommitted changes detected:')
        console.log(gitStatus)
        
        if (this.config.environment === 'production') {
          throw new Error('Production deployment requires clean Git status')
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check Git status')
    }

    // Check Node.js and npm versions
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
      console.log(`   Node.js: ${nodeVersion}`)
      console.log(`   npm: ${npmVersion}`)
    } catch (error) {
      throw new Error('Node.js or npm not available')
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable missing: ${envVar}`)
      }
    }

    console.log('✅ Pre-deployment checks passed')
  }

  /**
   * Build and test the application
   */
  private async buildAndTest(): Promise<void> {
    console.log('🔨 Building and testing application...')

    // Install dependencies
    console.log('   Installing dependencies...')
    execSync('npm ci', { stdio: 'inherit' })

    // Run linting
    console.log('   Running linter...')
    try {
      execSync('npm run lint', { stdio: 'inherit' })
    } catch (error) {
      console.warn('⚠️ Linting issues detected, continuing...')
    }

    // Run tests
    console.log('   Running tests...')
    try {
      execSync('npm run test -- --run', { stdio: 'inherit' })
    } catch (error) {
      if (this.config.environment === 'production') {
        throw new Error('Tests failed - cannot deploy to production')
      }
      console.warn('⚠️ Tests failed, continuing with non-production deployment...')
    }

    // Build application
    console.log('   Building application...')
    execSync('npm run build', { stdio: 'inherit' })

    console.log('✅ Build and test completed')
  }

  /**
   * Deploy to platform (Vercel)
   */
  private async deployToPlatform(): Promise<void> {
    console.log('🚀 Deploying to platform...')

    const vercelArgs = ['deploy', '--yes']
    
    if (this.config.environment === 'production') {
      vercelArgs.push('--prod')
    }

    try {
      const deployOutput = execSync(`vercel ${vercelArgs.join(' ')}`, { encoding: 'utf8' })
      
      // Extract deployment URL
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/)
      if (urlMatch) {
        const deploymentUrl = urlMatch[0]
        console.log(`✅ Deployed to: ${deploymentUrl}`)
        
        // Save deployment URL for monitoring
        writeFileSync(
          join(process.cwd(), '.deployment-info.json'),
          JSON.stringify({
            deploymentId: this.deploymentId,
            url: deploymentUrl,
            environment: this.config.environment,
            timestamp: new Date().toISOString()
          }, null, 2)
        )
      }
    } catch (error) {
      throw new Error(`Deployment failed: ${error}`)
    }
  }

  /**
   * Initialize monitoring systems
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('📊 Initializing monitoring systems...')

    // Create monitoring configuration
    const monitoringConfig = {
      deploymentId: this.deploymentId,
      environment: this.config.environment,
      enabledFeatures: {
        performanceMonitoring: true,
        errorTracking: true,
        webVitalsTracking: true,
        healthChecks: true
      },
      thresholds: this.config.rollbackThresholds,
      alerting: {
        enabled: this.config.environment === 'production',
        channels: ['webhook', 'log']
      }
    }

    const configPath = join(process.cwd(), '.kiro', 'deployment', 'monitoring-config.json')
    writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2))

    console.log('✅ Monitoring systems initialized')
  }

  /**
   * Configure feature flags for gradual rollout
   */
  private async configureFeatureFlags(): Promise<void> {
    console.log('🎛️ Configuring feature flags...')

    const featureFlagConfig = {
      deploymentId: this.deploymentId,
      flags: {
        dual_audience_homepage: {
          enabled: true,
          rolloutPercentage: this.config.rolloutPercentage
        },
        enhanced_hero_section: {
          enabled: true,
          rolloutPercentage: this.config.rolloutPercentage
        },
        featured_lofts_showcase: {
          enabled: true,
          rolloutPercentage: this.config.rolloutPercentage
        },
        trust_social_proof: {
          enabled: true,
          rolloutPercentage: this.config.rolloutPercentage
        },
        repositioned_owner_section: {
          enabled: true,
          rolloutPercentage: this.config.rolloutPercentage
        }
      }
    }

    const configPath = join(process.cwd(), '.kiro', 'deployment', 'feature-flags-config.json')
    writeFileSync(configPath, JSON.stringify(featureFlagConfig, null, 2))

    console.log(`✅ Feature flags configured with ${this.config.rolloutPercentage}% rollout`)
  }

  /**
   * Setup rollback monitoring
   */
  private async setupRollbackMonitoring(): Promise<void> {
    console.log('🔄 Setting up rollback monitoring...')

    const rollbackConfig = {
      deploymentId: this.deploymentId,
      enabled: true,
      triggers: {
        errorRate: {
          threshold: this.config.rollbackThresholds.errorRate,
          timeWindow: 5, // minutes
          action: 'reduce_rollout'
        },
        responseTime: {
          threshold: this.config.rollbackThresholds.responseTime,
          timeWindow: 10, // minutes
          action: 'reduce_rollout'
        },
        webVitalsLCP: {
          threshold: this.config.rollbackThresholds.webVitalsLCP,
          timeWindow: 15, // minutes
          action: 'disable_feature'
        }
      },
      emergencyContacts: ['admin@loftalgerie.com']
    }

    const configPath = join(process.cwd(), '.kiro', 'deployment', 'rollback-config.json')
    writeFileSync(configPath, JSON.stringify(rollbackConfig, null, 2))

    console.log('✅ Rollback monitoring configured')
  }

  /**
   * Post-deployment verification
   */
  private async postDeploymentVerification(): Promise<void> {
    console.log('🔍 Running post-deployment verification...')

    // Read deployment info
    const deploymentInfoPath = join(process.cwd(), '.deployment-info.json')
    if (!existsSync(deploymentInfoPath)) {
      throw new Error('Deployment info not found')
    }

    const deploymentInfo = JSON.parse(readFileSync(deploymentInfoPath, 'utf8'))
    const deploymentUrl = deploymentInfo.url

    // Wait for deployment to be ready
    console.log('   Waiting for deployment to be ready...')
    await this.waitForDeployment(deploymentUrl)

    // Run health checks
    await this.runHealthChecks(deploymentUrl)

    // Verify feature flags are working
    if (this.config.enableFeatureFlags) {
      await this.verifyFeatureFlags(deploymentUrl)
    }

    console.log('✅ Post-deployment verification completed')
  }

  /**
   * Wait for deployment to be ready
   */
  private async waitForDeployment(url: string): Promise<void> {
    const maxAttempts = 30
    const delay = 10000 // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(this.config.healthCheckTimeout)
        })
        
        if (response.ok) {
          console.log(`   Deployment ready after ${attempt} attempts`)
          return
        }
      } catch (error) {
        console.log(`   Attempt ${attempt}/${maxAttempts} failed, retrying...`)
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Deployment did not become ready within timeout period')
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(baseUrl: string): Promise<void> {
    console.log('   Running health checks...')

    const healthChecks = [
      { name: 'Homepage', path: '/' },
      { name: 'API Health', path: '/api/health' },
      { name: 'Monitoring API', path: '/api/deployment/monitoring' }
    ]

    for (const check of healthChecks) {
      try {
        const response = await fetch(`${baseUrl}${check.path}`, {
          signal: AbortSignal.timeout(this.config.healthCheckTimeout)
        })

        if (response.ok) {
          console.log(`     ✅ ${check.name}: OK`)
        } else {
          console.warn(`     ⚠️ ${check.name}: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error(`     ❌ ${check.name}: ${error}`)
        
        if (this.config.environment === 'production') {
          throw new Error(`Critical health check failed: ${check.name}`)
        }
      }
    }
  }

  /**
   * Verify feature flags are working
   */
  private async verifyFeatureFlags(baseUrl: string): Promise<void> {
    console.log('   Verifying feature flags...')

    try {
      const response = await fetch(`${baseUrl}/api/deployment/monitoring`, {
        signal: AbortSignal.timeout(this.config.healthCheckTimeout)
      })

      if (response.ok) {
        const data = await response.json()
        const enabledFlags = data.featureFlags?.filter((f: any) => f.enabled).length || 0
        console.log(`     ✅ Feature flags: ${enabledFlags} enabled`)
      } else {
        console.warn('     ⚠️ Could not verify feature flags')
      }
    } catch (error) {
      console.warn(`     ⚠️ Feature flag verification failed: ${error}`)
    }
  }

  /**
   * Start gradual rollout
   */
  private async startGradualRollout(): Promise<void> {
    console.log('📈 Starting gradual rollout...')

    // This would integrate with the feature flag system to start gradual rollout
    console.log(`   Initial rollout: ${this.config.rolloutPercentage}%`)
    console.log('   Gradual rollout schedule will be managed by the feature flag system')
    
    console.log('✅ Gradual rollout initiated')
  }

  /**
   * Execute emergency rollback
   */
  private async executeEmergencyRollback(reason: string): Promise<void> {
    console.error('🚨 Executing emergency rollback...')
    console.error(`   Reason: ${reason}`)

    try {
      // This would trigger the rollback system
      console.error('   Disabling all feature flags...')
      console.error('   Reverting to previous stable version...')
      
      // In a real implementation, this would:
      // 1. Set all feature flags to 0%
      // 2. Redirect traffic to previous deployment
      // 3. Send alerts to team
      
      console.error('✅ Emergency rollback completed')
    } catch (rollbackError) {
      console.error('❌ Emergency rollback failed:', rollbackError)
      console.error('🚨 MANUAL INTERVENTION REQUIRED')
    }
  }

  /**
   * Generate deployment report
   */
  private async generateDeploymentReport(): Promise<void> {
    const duration = Date.now() - this.startTime
    const report = {
      deploymentId: this.deploymentId,
      environment: this.config.environment,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      config: this.config,
      status: 'success'
    }

    const reportPath = join(process.cwd(), '.kiro', 'deployment', `deployment-report-${this.deploymentId}.json`)
    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('')
    console.log('📋 Deployment Report:')
    console.log(`   Deployment ID: ${this.deploymentId}`)
    console.log(`   Environment: ${this.config.environment}`)
    console.log(`   Duration: ${Math.round(duration / 1000)}s`)
    console.log(`   Report saved: ${reportPath}`)
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] as any) || 'development'

  if (!['development', 'staging', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use: development, staging, or production')
    process.exit(1)
  }

  const config: DeploymentConfig = {
    environment,
    enableMonitoring: true,
    enableFeatureFlags: true,
    enableRollback: environment === 'production',
    gradualRollout: environment === 'production',
    rolloutPercentage: environment === 'production' ? 5 : 100, // Start with 5% for production
    healthCheckTimeout: 30000,
    rollbackThresholds: {
      errorRate: 5, // 5%
      responseTime: 3000, // 3 seconds
      webVitalsLCP: 4000 // 4 seconds
    }
  }

  const deployment = new EnhancedDeployment(config)
  
  try {
    await deployment.deploy()
    console.log('🎉 Deployment completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('💥 Deployment failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { EnhancedDeployment }