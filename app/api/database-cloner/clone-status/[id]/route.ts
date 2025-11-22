/**
 * API Route: Get Clone Status
 * GET /api/database-cloner/clone-status/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrchestrator } from '@/lib/database-cloner/orchestrator-instance'

export async function GET(
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
        const status = orchestrator.getOperationStatus(operationId)

        if (!status) {
            return NextResponse.json(
                { success: false, error: 'Operation not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            status
        })

    } catch (error: any) {
        console.error('Error getting clone status:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get clone status',
                message: error.message
            },
            { status: 500 }
        )
    }
}
