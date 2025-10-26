/**
 * Web Vitals Recording API Route
 */

import { NextRequest } from 'next/server'
import { recordWebVitals } from '../../../../middleware/deployment-monitoring'

export async function POST(request: NextRequest) {
  return recordWebVitals(request)
}