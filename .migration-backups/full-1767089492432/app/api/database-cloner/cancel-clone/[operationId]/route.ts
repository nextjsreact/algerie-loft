/**
 * API Route: Cancel Clone Operation
 * 
 * Cancels an ongoing clone operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOrchestrator } from '@/lib/database-cloner/orchestrator-instance'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ operationId: string }> }
) {
    try {
        // Check authentication and authorization
        const session = await getSession()
        if (!session || session.user.role !== 'superuser') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const { operationId } = await params

        // Cancel the operation
        const orchestrator = getOrchestrator()
        const cancelled = orchestrator.cancelOperation(operationId)

        if (!cancelled) {
            return NextResponse.json(
                { success: false, error: 'Operation not found or already completed' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Operation cancelled successfully'
        })

    } catch (error: any) {
        console.error('Error cancelling clone:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to cancel clone operation' },
            { status: 500 }
        )
    }
}
