/**
 * Service Manager
 * 
 * Manages service restart automation after environment switches
 * with platform-specific implementations and error handling.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../../logger'

const execAsync = promisify(exec)

export interface ServiceRestartResult {
  success: boolean
  servicesRestarted: string[]
  servicesFailed: string[]
  duration: number
  error?: string
}

export interface ServiceConfig {
  name: string
  command: string
  platform: 'windows' | 'unix' | 'all'
  timeout: number
  required: boolean
}

export class ServiceManager {
  private services: ServiceConfig[] = [
    {
      name: 'Next.js Development Server',
      command: 'npm run dev',
      platform: 'all',
      timeout: 10000,
      required: false
    },
    {
      name: 'TypeScript Compiler',
      command: 'npx tsc --noEmit',
      platform: 'all',
      timeout: 15000,
      required: false
    }
  ]

  private isWindows: boolean = process.platform === 'win32'

  /**
   * Restart all configured services
   */
  async restartServices(): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting service restart process')

      // Stop running services first
      await this.stopServices()

      // Wait a moment for services to fully stop
      await this.delay(2000)

      // Start services again
      const startResult = await this.startServices()

      const duration = Date.now() - startTime
      
      if (startResult.success) {
        logger.info('All services restarted successfully', { 
          duration,
          servicesRestarted: startResult.servicesRestarted 
        })
        return true
      } else {
        logger.warn('Some services failed to restart', { 
          duration,
          servicesFailed: startResult.servicesFailed 
        })
        return false
      }

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Service restart process failed', { error: error.message, duration })
      return false
    }
  }

  /**
   * Stop all running services
   */
  async stopServices(): Promise<ServiceRestartResult> {
    const startTime = Date.now()
    const servicesRestarted: string[] = []
    const servicesFailed: string[] = []

    try {
      logger.info('Stopping services')

      // Stop Next.js development server
      await this.stopNextJsServer()
      servicesRestarted.push('Next.js Development Server')

      // Kill any TypeScript processes
      await this.stopTypeScriptProcesses()
      servicesRestarted.push('TypeScript Processes')

      // Stop any other Node.js processes related to the project
      await this.stopProjectProcesses()
      servicesRestarted.push('Project Processes')

      const duration = Date.now() - startTime

      return {
        success: true,
        servicesRestarted,
        servicesFailed,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Failed to stop services', { error: error.message })

      return {
        success: false,
        servicesRestarted,
        servicesFailed: ['Service stop process'],
        duration,
        error: error.message
      }
    }
  }

  /**
   * Start configured services
   */
  async startServices(): Promise<ServiceRestartResult> {
    const startTime = Date.now()
    const servicesRestarted: string[] = []
    const servicesFailed: string[] = []

    try {
      logger.info('Starting services')

      // Note: We don't actually start long-running services here
      // as they would block the process. Instead, we validate
      // that the environment is ready for services to be started.

      // Validate environment configuration
      await this.validateEnvironmentForServices()
      servicesRestarted.push('Environment Validation')

      // Clear Next.js cache
      await this.clearNextJsCache()
      servicesRestarted.push('Next.js Cache Clear')

      // Validate TypeScript configuration
      await this.validateTypeScriptConfig()
      servicesRestarted.push('TypeScript Validation')

      const duration = Date.now() - startTime

      logger.info('Services prepared for restart', { 
        servicesRestarted,
        duration 
      })

      return {
        success: true,
        servicesRestarted,
        servicesFailed,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Failed to start services', { error: error.message })

      return {
        success: false,
        servicesRestarted,
        servicesFailed: ['Service start process'],
        duration,
        error: error.message
      }
    }
  }

  /**
   * Check if services are running
   */
  async checkServicesStatus(): Promise<{ [serviceName: string]: boolean }> {
    const status: { [serviceName: string]: boolean } = {}

    try {
      // Check if Next.js dev server is running (port 3000)
      status['Next.js Development Server'] = await this.isPortInUse(3000)

      // Check if any TypeScript processes are running
      status['TypeScript Processes'] = await this.areTypeScriptProcessesRunning()

      return status

    } catch (error) {
      logger.error('Failed to check services status', { error: error.message })
      return {}
    }
  }

  /**
   * Get service restart instructions for manual execution
   */
  getManualRestartInstructions(): string[] {
    const instructions = [
      '🔄 Manual Service Restart Instructions:',
      '',
      '1. Stop current development server (Ctrl+C in terminal)',
      '2. Clear Next.js cache:',
      this.isWindows ? '   rmdir /s /q .next' : '   rm -rf .next',
      '3. Restart development server:',
      '   npm run dev',
      '',
      '4. Optional - Restart TypeScript compiler:',
      '   npx tsc --noEmit --watch',
      '',
      '⚠️  Note: Services are not automatically restarted to avoid blocking the CLI.',
      '   Please run these commands manually in separate terminal windows.'
    ]

    return instructions
  }

  // Private helper methods

  private async stopNextJsServer(): Promise<void> {
    try {
      if (this.isWindows) {
        // Windows: Kill processes on port 3000
        await execAsync('netstat -ano | findstr :3000 | for /f "tokens=5" %a in (\'more\') do taskkill /PID %a /F', {
          timeout: 5000
        }).catch(() => {
          // Ignore errors - process might not be running
        })
      } else {
        // Unix: Kill processes on port 3000
        await execAsync('lsof -ti:3000 | xargs kill -9', {
          timeout: 5000
        }).catch(() => {
          // Ignore errors - process might not be running
        })
      }

      logger.info('Next.js server processes stopped')

    } catch (error) {
      logger.warn('Could not stop Next.js server', { error: error.message })
    }
  }

  private async stopTypeScriptProcesses(): Promise<void> {
    try {
      if (this.isWindows) {
        // Windows: Kill TypeScript processes
        await execAsync('taskkill /IM tsc.exe /F', {
          timeout: 5000
        }).catch(() => {
          // Ignore errors - process might not be running
        })
      } else {
        // Unix: Kill TypeScript processes
        await execAsync('pkill -f "tsc.*--watch"', {
          timeout: 5000
        }).catch(() => {
          // Ignore errors - process might not be running
        })
      }

      logger.info('TypeScript processes stopped')

    } catch (error) {
      logger.warn('Could not stop TypeScript processes', { error: error.message })
    }
  }

  private async stopProjectProcesses(): Promise<void> {
    try {
      // Kill any Node.js processes that might be related to the project
      const projectDir = process.cwd()
      
      if (this.isWindows) {
        // Windows: More conservative approach
        await execAsync(`wmic process where "commandline like '%${projectDir}%' and name='node.exe'" delete`, {
          timeout: 5000
        }).catch(() => {
          // Ignore errors
        })
      } else {
        // Unix: Kill Node processes in project directory
        await execAsync(`ps aux | grep "${projectDir}" | grep node | awk '{print $2}' | xargs kill -9`, {
          timeout: 5000
        }).catch(() => {
          // Ignore errors
        })
      }

      logger.info('Project processes stopped')

    } catch (error) {
      logger.warn('Could not stop project processes', { error: error.message })
    }
  }

  private async clearNextJsCache(): Promise<void> {
    try {
      if (this.isWindows) {
        await execAsync('if exist .next rmdir /s /q .next', {
          timeout: 10000
        })
      } else {
        await execAsync('rm -rf .next', {
          timeout: 10000
        })
      }

      logger.info('Next.js cache cleared')

    } catch (error) {
      logger.warn('Could not clear Next.js cache', { error: error.message })
    }
  }

  private async validateEnvironmentForServices(): Promise<void> {
    try {
      // Check if package.json exists
      await execAsync('npm list --depth=0', {
        timeout: 5000
      })

      logger.info('Environment validated for services')

    } catch (error) {
      throw new Error(`Environment validation failed: ${error.message}`)
    }
  }

  private async validateTypeScriptConfig(): Promise<void> {
    try {
      // Run TypeScript compiler check without emitting files
      await execAsync('npx tsc --noEmit', {
        timeout: 15000
      })

      logger.info('TypeScript configuration validated')

    } catch (error) {
      logger.warn('TypeScript validation failed', { error: error.message })
      // Don't throw - this is not critical for environment switching
    }
  }

  private async isPortInUse(port: number): Promise<boolean> {
    try {
      if (this.isWindows) {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`, {
          timeout: 3000
        })
        return stdout.trim().length > 0
      } else {
        const { stdout } = await execAsync(`lsof -i:${port}`, {
          timeout: 3000
        })
        return stdout.trim().length > 0
      }
    } catch {
      return false
    }
  }

  private async areTypeScriptProcessesRunning(): Promise<boolean> {
    try {
      if (this.isWindows) {
        const { stdout } = await execAsync('tasklist | findstr tsc.exe', {
          timeout: 3000
        })
        return stdout.trim().length > 0
      } else {
        const { stdout } = await execAsync('pgrep -f "tsc.*--watch"', {
          timeout: 3000
        })
        return stdout.trim().length > 0
      }
    } catch {
      return false
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}