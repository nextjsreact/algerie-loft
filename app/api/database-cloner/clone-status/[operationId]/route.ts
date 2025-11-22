/**
 * API Route: Get Clone Status
 * 
 * Returns the current status of a clone operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { orchestrator } from '@/lib/database-cloner/orchestrator-instance'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ operationId: string }> }
) {
    try {
        // Check authentication
        const session = await getSession()
        if (!session || session.user.role !== 'superuser') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const { operationId } = await params

        // Get operation status
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
            { success: false, error: error.message || 'Failed to get clone status' },
            { status: 500 }
        )
    }
}
