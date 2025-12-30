/**
 * Schedule Manager for Automation Tasks
 * 
 * Manages scheduling and execution of automated tasks with cron-like functionality
 */

export interface ScheduleConfig {
  id: string
  name: string
  description: string
  cronExpression: string
  enabled: boolean
  task: () => Promise<void>
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  timeout?: number // in milliseconds
  retries?: number
  retryDelay?: number // in milliseconds
}

export interface ScheduleStatus {
  id: string
  name: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  status: 'idle' | 'running' | 'error' | 'disabled'
  lastResult?: 'success' | 'error'
  lastError?: string
  runCount: number
  errorCount: number
}

export class ScheduleManager {
  private schedules: Map<string, ScheduleConfig> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private status: Map<string, ScheduleStatus> = new Map()
  private isRunning: boolean = false

  /**
   * Add a scheduled task
   */
  public addSchedule(config: ScheduleConfig): void {
    if (this.schedules.has(config.id)) {
      throw new Error(`Schedule with id '${config.id}' already exists`)
    }

    this.schedules.set(config.id, config)
    this.status.set(config.id, {
      id: config.id,
      name: config.name,
      enabled: config.enabled,
      status: config.enabled ? 'idle' : 'disabled',
      runCount: 0,
      errorCount: 0
    })

    if (config.enabled && this.isRunning) {
      this.scheduleTask(config)
    }

    console.log(`📅 Added schedule: ${config.name} (${config.cronExpression})`)
  }

  /**
   * Remove a scheduled task
   */
  public removeSchedule(id: string): void {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }

    this.schedules.delete(id)
    this.status.delete(id)

    console.log(`🗑️  Removed schedule: ${id}`)
  }

  /**
   * Enable/disable a scheduled task
   */
  public setScheduleEnabled(id: string, enabled: boolean): void {
    const config = this.schedules.get(id)
    const status = this.status.get(id)

    if (!config || !status) {
      throw new Error(`Schedule '${id}' not found`)
    }

    config.enabled = enabled
    status.enabled = enabled
    status.status = enabled ? 'idle' : 'disabled'

    if (enabled && this.isRunning) {
      this.scheduleTask(config)
    } else {
      const timer = this.timers.get(id)
      if (timer) {
        clearTimeout(timer)
        this.timers.delete(id)
      }
    }

    console.log(`${enabled ? '✅' : '❌'} Schedule ${enabled ? 'enabled' : 'disabled'}: ${config.name}`)
  }

  /**
   * Start the schedule manager
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️  Schedule manager is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting schedule manager...')

    // Schedule all enabled tasks
    for (const config of this.schedules.values()) {
      if (config.enabled) {
        this.scheduleTask(config)
      }
    }

    console.log(`✅ Schedule manager started with ${this.schedules.size} schedules`)
  }

  /**
   * Stop the schedule manager
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Schedule manager is not running')
      return
    }

    this.isRunning = false
    console.log('🛑 Stopping schedule manager...')

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()

    // Update all statuses to disabled
    for (const status of this.status.values()) {
      if (status.status !== 'running') {
        status.status = 'disabled'
      }
    }

    console.log('✅ Schedule manager stopped')
  }

  /**
   * Execute a scheduled task immediately
   */
  public async executeNow(id: string): Promise<void> {
    const config = this.schedules.get(id)
    const status = this.status.get(id)

    if (!config || !status) {
      throw new Error(`Schedule '${id}' not found`)
    }

    if (status.status === 'running') {
      throw new Error(`Schedule '${id}' is already running`)
    }

    console.log(`▶️  Executing schedule immediately: ${config.name}`)
    await this.executeTask(config)
  }

  /**
   * Get status of all schedules
   */
  public getScheduleStatuses(): ScheduleStatus[] {
    return Array.from(this.status.values())
  }

  /**
   * Get status of a specific schedule
   */
  public getScheduleStatus(id: string): ScheduleStatus | undefined {
    return this.status.get(id)
  }

  /**
   * Schedule a task based on cron expression
   */
  private scheduleTask(config: ScheduleConfig): void {
    const nextRun = this.calculateNextRun(config.cronExpression)
    const delay = nextRun.getTime() - Date.now()

    const status = this.status.get(config.id)!
    status.nextRun = nextRun

    const timer = setTimeout(async () => {
      await this.executeTask(config)
      
      // Reschedule if still enabled and manager is running
      if (config.enabled && this.isRunning) {
        this.scheduleTask(config)
      }
    }, delay)

    this.timers.set(config.id, timer)

    console.log(`⏰ Scheduled '${config.name}' for ${nextRun.toLocaleString()}`)
  }

  /**
   * Execute a scheduled task with error handling and retries
   */
  private async executeTask(config: ScheduleConfig): Promise<void> {
    const status = this.status.get(config.id)!
    
    status.status = 'running'
    status.lastRun = new Date()
    status.runCount++

    console.log(`▶️  Executing: ${config.name}`)

    let attempt = 0
    const maxAttempts = (config.retries || 0) + 1

    while (attempt < maxAttempts) {
      try {
        // Execute with timeout if configured
        if (config.timeout) {
          await this.executeWithTimeout(config.task, config.timeout)
        } else {
          await config.task()
        }

        // Success
        status.status = 'idle'
        status.lastResult = 'success'
        status.lastError = undefined

        if (config.onSuccess) {
          config.onSuccess(null)
        }

        console.log(`✅ Completed: ${config.name}`)
        return

      } catch (error) {
        attempt++
        status.errorCount++

        if (attempt < maxAttempts) {
          console.log(`⚠️  Attempt ${attempt} failed for '${config.name}': ${error.message}`)
          console.log(`🔄 Retrying in ${config.retryDelay || 5000}ms...`)
          
          await this.delay(config.retryDelay || 5000)
        } else {
          // All attempts failed
          status.status = 'error'
          status.lastResult = 'error'
          status.lastError = error.message

          if (config.onError) {
            config.onError(error)
          }

          console.error(`❌ Failed: ${config.name} - ${error.message}`)
        }
      }
    }
  }

  /**
   * Execute task with timeout
   */
  private async executeWithTimeout(task: () => Promise<void>, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task timed out after ${timeout}ms`))
      }, timeout)

      task()
        .then(() => {
          clearTimeout(timer)
          resolve()
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * Calculate next run time based on cron expression
   * Simplified implementation - in production, use a proper cron library
   */
  private calculateNextRun(cronExpression: string): Date {
    // This is a simplified implementation
    // In a real implementation, use a library like 'node-cron' or 'cron-parser'
    
    const now = new Date()
    const nextRun = new Date(now)

    // Parse simple expressions like "0 2 * * *" (daily at 2 AM)
    const parts = cronExpression.split(' ')
    
    if (parts.length >= 5) {
      const minute = parseInt(parts[0]) || 0
      const hour = parseInt(parts[1]) || 0
      
      nextRun.setHours(hour, minute, 0, 0)
      
      // If the time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
    } else {
      // Default to 1 hour from now for invalid expressions
      nextRun.setHours(nextRun.getHours() + 1)
    }

    return nextRun
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create common schedule configurations
   */
  public static createDailySchedule(
    id: string,
    name: string,
    hour: number,
    minute: number,
    task: () => Promise<void>
  ): ScheduleConfig {
    return {
      id,
      name,
      description: `Daily at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      cronExpression: `${minute} ${hour} * * *`,
      enabled: true,
      task,
      retries: 2,
      retryDelay: 30000, // 30 seconds
      timeout: 3600000 // 1 hour
    }
  }

  /**
   * Create weekly schedule configuration
   */
  public static createWeeklySchedule(
    id: string,
    name: string,
    dayOfWeek: number,
    hour: number,
    minute: number,
    task: () => Promise<void>
  ): ScheduleConfig {
    return {
      id,
      name,
      description: `Weekly on day ${dayOfWeek} at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      cronExpression: `${minute} ${hour} * * ${dayOfWeek}`,
      enabled: true,
      task,
      retries: 2,
      retryDelay: 60000, // 1 minute
      timeout: 7200000 // 2 hours
    }
  }
}

/**
 * CLI function to manage schedules
 */
export async function manageSchedules(command: string, ...args: string[]): Promise<void> {
  const manager = new ScheduleManager()

  switch (command) {
    case 'start':
      manager.start()
      
      // Keep running
      process.on('SIGINT', () => {
        console.log('\nStopping schedule manager...')
        manager.stop()
        process.exit(0)
      })
      
      // Keep alive
      setInterval(() => {}, 1000)
      break

    case 'status':
      const statuses = manager.getScheduleStatuses()
      console.log('\n📋 Schedule Status:')
      statuses.forEach(status => {
        console.log(`  ${status.enabled ? '✅' : '❌'} ${status.name} - ${status.status}`)
        if (status.nextRun) {
          console.log(`    Next run: ${status.nextRun.toLocaleString()}`)
        }
        console.log(`    Runs: ${status.runCount}, Errors: ${status.errorCount}`)
      })
      break

    default:
      console.log('Usage: tsx schedule-manager.ts [start|status]')
      console.log('  start  - Start the schedule manager')
      console.log('  status - Show schedule status')
      process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  
  if (!command) {
    console.log('Usage: tsx schedule-manager.ts [start|status]')
    process.exit(1)
  }
  
  manageSchedules(command, ...args)
}