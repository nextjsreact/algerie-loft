/**
 * API Route: Cancel Clone Operation
 * POST /api/database-cloner/cancel-clone/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrchestrator } from '@/lib/database-cloner/orchestrator-instance'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const operationId = id

        if (!operationId) {
            return NextResponse.json(
                { success: false, error: 'Operation ID is required' },
                { status: 400 }
            )
        }

        const orchestrator = getOrchestrator()
        await orchestrator.cancelOperation(operationId)

        return NextResponse.json({
            success: true,
            message: 'Operation cancelled successfully'
        })

    } catch (error: any) {
        console.error('Error cancelling clone:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to cancel clone operation',
                message: error.message
            },
            { status: 500 }
        )
    }
}
