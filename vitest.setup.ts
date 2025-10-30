import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock process.env for tests
process.env.NODE_ENV = 'test'

// Mock Next.js specific modules that might cause issues in tests
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(public url: string, public init?: any) {}
    json() { return Promise.resolve(this.init?.body ? JSON.parse(this.init.body) : {}) }
  },
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map([['content-type', 'application/json']])
    })
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: null })
  })
}))

// Global test timeout
vi.setConfig({ testTimeout: 10000 })