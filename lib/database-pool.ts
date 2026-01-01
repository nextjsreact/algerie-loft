/**
 * Database Connection Pool Manager
 * Optimizes database connections to prevent ECONNRESET errors
 */

import { createClient } from '@supabase/supabase-js'

interface PoolConfig {
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
  retryAttempts: number
  retryDelay: number
}

class DatabasePool {
  private static instance: DatabasePool
  private connections: Map<string, any> = new Map()
  private config: PoolConfig

  constructor() {
    this.config = {
      maxConnections: 10,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000 // 1 second
    }
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool()
    }
    return DatabasePool.instance
  }

  async getConnection(key: string = 'default'): Promise<any> {
    try {
      // Check if we have an existing connection
      if (this.connections.has(key)) {
        const connection = this.connections.get(key)
        if (this.isConnectionHealthy(connection)) {
          return connection
        } else {
          // Remove unhealthy connection
          this.connections.delete(key)
        }
      }

      // Create new connection with optimized settings
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-application-name': 'loft-algerie',
              'Connection': 'keep-alive',
              'Keep-Alive': 'timeout=30, max=100'
            }
          },
          realtime: {
            params: {
              eventsPerSecond: 5
            }
          }
        }
      )

      // Store connection
      this.connections.set(key, supabase)

      // Set up cleanup timer
      setTimeout(() => {
        if (this.connections.has(key)) {
          this.connections.delete(key)
        }
      }, this.config.idleTimeout)

      return supabase
    } catch (error) {
      console.error('Failed to create database connection:', error)
      throw error
    }
  }

  async executeWithRetry<T>(
    operation: (supabase: any) => Promise<T>,
    key: string = 'default'
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const supabase = await this.getConnection(key)
        
        // Add timeout to the operation
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), this.config.connectionTimeout)
        })

        const result = await Promise.race([
          operation(supabase),
          timeoutPromise
        ])

        return result
      } catch (error: any) {
        lastError = error
        
        // Check if it's a connection error
        if (this.isConnectionError(error)) {
          console.warn(`Database connection error (attempt ${attempt}/${this.config.retryAttempts}):`, error.message)
          
          // Remove failed connection
          this.connections.delete(key)
          
          // Wait before retry
          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * attempt)
          }
        } else {
          // Non-connection error, don't retry
          throw error
        }
      }
    }

    throw lastError || new Error('Max retry attempts reached')
  }

  private isConnectionHealthy(connection: any): boolean {
    // Basic health check - you can expand this
    return connection && typeof connection.from === 'function'
  }

  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'fetch failed',
      'network error',
      'connection error',
      'timeout'
    ]

    const errorMessage = error.message?.toLowerCase() || ''
    return connectionErrors.some(errorType => errorMessage.includes(errorType))
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Clean up all connections
  cleanup(): void {
    this.connections.clear()
  }

  // Get pool statistics
  getStats(): { activeConnections: number, maxConnections: number } {
    return {
      activeConnections: this.connections.size,
      maxConnections: this.config.maxConnections
    }
  }
}

// Export singleton instance
export const dbPool = DatabasePool.getInstance()

// Helper function for common database operations
export async function withDatabase<T>(
  operation: (supabase: any) => Promise<T>,
  key?: string
): Promise<T> {
  return dbPool.executeWithRetry(operation, key)
}

// Helper for admin operations
export async function withAdminDatabase<T>(
  operation: (supabase: any) => Promise<T>
): Promise<T> {
  const adminOperation = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-application-name': 'loft-algerie-admin',
            'Connection': 'keep-alive'
          }
        }
      }
    )
    
    return operation(supabase)
  }

  return dbPool.executeWithRetry(adminOperation, 'admin')
}