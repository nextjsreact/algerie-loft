/**
 * Deployment Monitoring API Routes
 * 
 * Provides REST API endpoints for deployment monitoring, feature flags, and rollback operations.
 */

import { NextRequest } from 'next/server'
import { getMonitoringDashboard } from '../../../../middleware/deployment-monitoring'

export async function GET(request: NextRequest) {
  return getMonitoringDashboard()
}