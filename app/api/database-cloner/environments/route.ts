/**
 * API Route: Get Configured Environments
 * 
 * Returns list of pre-configured environments from .env
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getSession()
        if (!session || session.user.role !== 'superuser') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Define configured environments
        // In a real implementation, these would be loaded from .env or a config file
        const environments = [
            {
                id: 'production',
                name: 'Production',
                description: 'Main production database',
                canBeSource: true,
                canBeTarget: false
            },
            {
                id: 'staging',
                name: 'Staging',
                description: 'Staging environment for testing',
                canBeSource: true,
                canBeTarget: true
            },
            {
                id: 'development',
                name: 'Development',
                description: 'Local development database',
                canBeSource: false,
                canBeTarget: true
            },
            {
                id: 'training',
                name: 'Training',
                description: 'Training environment for demos',
                canBeSource: false,
                canBeTarget: true
            }
        ]

        return NextResponse.json({
            success: true,
            environments
        })

    } catch (error: any) {
        console.error('Error getting environments:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get environments' },
            { status: 500 }
        )
    }
}
