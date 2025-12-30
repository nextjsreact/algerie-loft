/**
 * Rollback API Route
 */

import { NextRequest } from 'next/server'
import { triggerManualRollback } from '../../../../middleware/deployment-monitoring'

export async function POST(request: NextRequest) {
  return triggerManualRollback(request)
}