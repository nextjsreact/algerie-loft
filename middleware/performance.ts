import { NextRequest, NextResponse } from 'next/server'

export function performanceMiddleware(request: NextRequest) {
  const start = Date.now()
  
  // Add performance headers
  const response = NextResponse.next()
  
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`)
  response.headers.set('X-Cache-Control', 'public, max-age=60')
  
  return response
}
