/**
 * API Route: Start Clone Operation
 * 
 * Initiates a database cloning operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { orchestrator } from '@/lib/database-cloner/orchestrator-instance'

export async function POST(request: NextRequest) {
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
        const operationId = await orchestrator.startClone(source, target, options)

        return NextResponse.json({
            success: true,
            operationId,
            message: 'Clone operation started successfully'
        })

    } catch (error: any) {
        console.error('Error starting clone:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to start clone operation' },
            { status: 500 }
        )
    }
}
