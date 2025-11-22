/**
 * API Route: Start Clone Operation
 * 
 * Initiates a database cloning operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOrchestrator } from '@/lib/database-cloner/orchestrator-instance'

// Global lock to prevent simultaneous clones - using object for reference stability
const cloneLock = { inProgress: false, timestamp: 0 }

export async function POST(request: NextRequest) {
    const now = Date.now()
    console.log('═══════════════════════════════════════════════════════')
    console.log('🔴🔴🔴 API ROUTE CALLED AT:', new Date().toISOString())
    console.log('🔴🔴🔴 cloneLock.inProgress:', cloneLock.inProgress)
    console.log('🔴🔴🔴 cloneLock.timestamp:', cloneLock.timestamp)
    console.log('═══════════════════════════════════════════════════════')
    
    // Check if a clone is already in progress (with 10 second grace period)
    // Auto-release lock if it's been more than 10 seconds (stale lock)
    if (cloneLock.inProgress) {
        const lockAge = now - cloneLock.timestamp
        if (lockAge < 10000) {
            console.log(`⚠️ [START-CLONE API] Clone already in progress (${lockAge}ms ago), rejecting request`)
            return NextResponse.json(
                { success: false, error: 'A clone operation is already in progress. Please wait for it to complete.' },
                { status: 409 }
            )
        } else {
            console.log(`⚠️ [START-CLONE API] Stale lock detected (${lockAge}ms old), releasing it`)
            cloneLock.inProgress = false
        }
    }
    
    // Acquire lock IMMEDIATELY
    cloneLock.inProgress = true
    cloneLock.timestamp = now
    try {
        // Check authentication and authorization
        const session = await getSession()
        if (!session || session.user.role !== 'superuser') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { source, target, options } = body

        if (!source || !target) {
            return NextResponse.json(
                { success: false, error: 'Source and target environments are required' },
                { status: 400 }
            )
        }

        // Start the clone operation
        console.log('🔵 [START-CLONE API] Starting clone with lock acquired')
        
        const orchestrator = getOrchestrator()
        const cloneRequest = {
            source,
            target,
            options: options || {
                createBackup: true,
                anonymizeData: false,
                includeStorage: false,
                includeFunctions: true,
                includeTriggers: true
            }
        }
        
        const operationId = await orchestrator.startClone(cloneRequest)
        
        // Keep lock for 5 seconds to ensure clone has started
        setTimeout(() => {
            cloneLock.inProgress = false
            console.log('🔵 [START-CLONE API] Lock released after 5 seconds')
        }, 5000)

        return NextResponse.json({
            success: true,
            operationId,
            message: 'Clone operation started successfully'
        })

    } catch (error: any) {
        console.error('Error starting clone:', error)
        cloneLock.inProgress = false // Release lock on error
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to start clone operation' },
            { status: 500 }
        )
    }
}
