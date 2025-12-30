#!/usr/bin/env tsx
/**
 * Simple runner for security validation
 * Task 3: Checkpoint - Validation du système de sécurité
 */

import { validateSecuritySystems } from './migration/validate-security-systems'

async function main() {
  console.log('🔒 Starting Security Systems Validation...')
  console.log('Task 3: Checkpoint - Validation du système de sécurité')
  console.log('')
  
  try {
    await validateSecuritySystems()
  } catch (error) {
    console.error('❌ Security validation failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}