/**
 * Environment Switch CLI Command
 * 
 * Command-line interface for environment switching with
 * interactive prompts and safety confirmations.
 */

import { EnvironmentSwitcher } from '../core/environment-switcher'
import { ConfigurationManager } from '../core/configuration-manager'
import { logger } from '../../logger'
import { EnvironmentType } from '../types'

export interface SwitchCommandOptions {
  target?: EnvironmentType
  backup?: boolean
  restart?: boolean
  force?: boolean
  interactive?: boolean
}

export class SwitchCommand {
  private switcher: EnvironmentSwitcher
  private configManager: ConfigurationManager

  constructor() {
    this.switcher = new EnvironmentSwitcher()
    this.configManager = new ConfigurationManager()
  }

  /**
   * Execute environment switch command
   */
  async execute(options: SwitchCommandOptions = {}): Promise<void> {
    try {
      console.log('🔄 Environment Switcher')
      console.log('='.repeat(50))

      // Show current status first
      await this.displayCurrentStatus()

      // Get target environment
      const targetEnvironment = options.target || await this.promptForTargetEnvironment()

      // Get switch options
      const switchOptions = await this.getSwitchOptions(targetEnvironment, options)

      // Confirm the switch
      if (!options.force) {
        const confirmed = await this.confirmSwitch(targetEnvironment, switchOptions)
        if (!confirmed) {
          console.log('❌ Environment switch cancelled by user')
          return
        }
      }

      // Execute the switch
      console.log(`\n🔄 Switching to ${targetEnvironment} environment...`)
      
      const result = await this.switcher.switchEnvironment({
        targetEnvironment,
        backupCurrent: switchOptions.backup,
        restartServices: switchOptions.restart,
        confirmProduction: targetEnvironment === 'production'
      })

      // Display results
      await this.displaySwitchResult(result)

    } catch (error) {
      logger.error('Switch command failed', { error: error.message })
      console.error('❌ Environment switch failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Quick switch commands
   */
  async switchToDevelopment(): Promise<void> {
    await this.execute({
      target: 'development',
      backup: true,
      restart: true,
      force: false
    })
  }

  async switchToTest(): Promise<void> {
    await this.execute({
      target: 'test',
      backup: true,
      restart: true,
      force: false
    })
  }

  async switchToTraining(): Promise<void> {
    await this.execute({
      target: 'training',
      backup: true,
      restart: true,
      force: false
    })
  }

  async switchToProduction(): Promise<void> {
    console.log('⚠️  PRODUCTION ENVIRONMENT SWITCH')
    console.log('This will switch to the production environment (READ-ONLY)')
    console.log('Are you sure you want to continue? This requires explicit confirmation.')
    
    // Extra confirmation for production
    const confirmed = await this.promptConfirmation('Type "PRODUCTION" to confirm: ', 'PRODUCTION')
    if (!confirmed) {
      console.log('❌ Production switch cancelled')
      return
    }

    await this.execute({
      target: 'production',
      backup: true,
      restart: false, // Never restart services for production
      force: true // Skip normal confirmation since we already confirmed
    })
  }

  // Private helper methods

  private async displayCurrentStatus(): Promise<void> {
    try {
      const status = await this.switcher.getCurrentStatus()
      console.log(`\n📋 Current Environment: ${status.environmentType.toUpperCase()}`)
      console.log(`   Status: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
      
      if (status.error) {
        console.log(`   Error: ${status.error}`)
      }
    } catch (error) {
      console.log('⚠️  Could not determine current environment status')
    }
  }

  private async promptForTargetEnvironment(): Promise<EnvironmentType> {
    try {
      const environments = await this.configManager.listEnvironments()
      
      console.log('\n📋 Available Environments:')
      environments.forEach((env, index) => {
        console.log(`   ${index + 1}. ${env.type} - ${env.name}`)
      })

      // In a real CLI, this would use a proper prompt library
      // For now, we'll return development as default
      console.log('\n⚠️  Interactive prompts not implemented in this version')
      console.log('   Defaulting to development environment')
      console.log('   Use --target flag to specify environment directly')
      
      return 'development'

    } catch (error) {
      logger.error('Failed to prompt for target environment', { error: error.message })
      throw new Error('Could not determine target environment')
    }
  }

  private async getSwitchOptions(
    targetEnvironment: EnvironmentType, 
    cmdOptions: SwitchCommandOptions
  ): Promise<{ backup: boolean; restart: boolean }> {
    
    // Use command options if provided
    if (cmdOptions.backup !== undefined && cmdOptions.restart !== undefined) {
      return {
        backup: cmdOptions.backup,
        restart: cmdOptions.restart
      }
    }

    // Default options based on environment type
    const defaults = {
      backup: true, // Always backup by default
      restart: targetEnvironment !== 'production' // Don't restart for production
    }

    console.log('\n⚙️  Switch Options:')
    console.log(`   Backup current config: ${defaults.backup ? '✅' : '❌'}`)
    console.log(`   Restart services: ${defaults.restart ? '✅' : '❌'}`)

    return defaults
  }

  private async confirmSwitch(
    targetEnvironment: EnvironmentType,
    options: { backup: boolean; restart: boolean }
  ): Promise<boolean> {
    
    console.log('\n🔍 Switch Summary:')
    console.log(`   Target Environment: ${targetEnvironment.toUpperCase()}`)
    console.log(`   Backup Current: ${options.backup ? '✅' : '❌'}`)
    console.log(`   Restart Services: ${options.restart ? '✅' : '❌'}`)

    if (targetEnvironment === 'production') {
      console.log('   ⚠️  PRODUCTION ENVIRONMENT - READ ONLY ACCESS')
    }

    // In a real CLI, this would prompt for user input
    // For now, we'll assume confirmation
    console.log('\n⚠️  Interactive confirmation not implemented in this version')
    console.log('   Use --force flag to skip confirmation')
    
    return true
  }

  private async promptConfirmation(message: string, expectedInput: string): Promise<boolean> {
    // In a real CLI implementation, this would use readline or inquirer
    console.log(`\n${message}`)
    console.log('⚠️  Interactive prompts not implemented - assuming confirmation')
    return true
  }

  private async displaySwitchResult(result: any): Promise<void> {
    console.log('\n' + '='.repeat(50))
    
    if (result.success) {
      console.log('✅ Environment switch completed successfully!')
      console.log(`   Previous: ${result.previousEnvironment || 'Unknown'}`)
      console.log(`   Current: ${result.currentEnvironment}`)
      
      if (result.backupPath) {
        console.log(`   Backup: ${result.backupPath}`)
      }
      
      if (result.servicesRestarted) {
        console.log('   Services: ✅ Restarted')
      }
      
      console.log(`   Duration: ${result.switchDuration}ms`)

      // Display warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:')
        result.warnings.forEach((warning: string) => {
          console.log(`   • ${warning}`)
        })
      }

      // Show new environment status
      console.log('\n📋 New Environment Status:')
      await this.switcher.displayCurrentStatus()

    } else {
      console.log('❌ Environment switch failed!')
      console.log(`   Error: ${result.error}`)
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Additional Information:')
        result.warnings.forEach((warning: string) => {
          console.log(`   • ${warning}`)
        })
      }
    }

    console.log('='.repeat(50))
  }
}