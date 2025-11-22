/**
 * API Route: Validate Connection
 * 
 * Validates database connection credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { validateConnection } from '@/lib/database-cloner/connection-validator'

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getSession()
        if (!session || session.user.role !== 'superuser') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { environment } = body

        if (!environment || !environment.credentials) {
            return NextResponse.json(
                { success: false, error: 'Environment credentials are required' },
                { status: 400 }
            )
        }

        // Validate the connection
        const result = await validateConnection(environment)

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error: any) {
        console.error('Error validating connection:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to validate connection' },
            { status: 500 }
        )
    }
}
