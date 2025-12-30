/**
 * Feature Flags API Routes
 */

import { NextRequest } from 'next/server'
import { updateFeatureRollout, startGradualRollout } from '../../../../middleware/deployment-monitoring'

export async function PUT(request: NextRequest) {
  return updateFeatureRollout(request)
}

export async function POST(request: NextRequest) {
  return startGradualRollout(request)
}