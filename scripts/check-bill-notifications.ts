#!/usr/bin/env tsx

/**
 * Bill Due Date Notification Checker
 * 
 * This script checks for upcoming and overdue bill due dates and sends notifications.
 * It should be run daily via a cron job or scheduled task.
 * 
 * Usage:
 * - Run manually: npx tsx scripts/check-bill-notifications.ts
 * - Schedule daily: Add to cron job or Windows Task Scheduler
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { runBillMonitoring } from '@/lib/services/bill-monitoring'
import { logger } from '@/lib/logger'

// Load environment variables from .env file explicitly
config({ path: resolve(process.cwd(), '.env') })

async function main() {
  logger.info('Starting comprehensive bill monitoring check')
  
  try {
    await runBillMonitoring()
    logger.info('Bill monitoring completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Bill monitoring failed', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

main()