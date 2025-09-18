/**
 * Global setup for Task-Loft Association tests
 * Prepares the test environment before running tests
 */

module.exports = async () => {
  console.log('🔧 Setting up Task-Loft Association test environment...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
  
  // Setup global test data
  global.testData = {
    users: [
      { id: 'admin-1', full_name: 'Admin User', email: 'admin@test.com', role: 'admin' },
      { id: 'manager-1', full_name: 'Manager User', email: 'manager@test.com', role: 'manager' },
      { id: 'member-1', full_name: 'Member User', email: 'member@test.com', role: 'member' }
    ],
    lofts: [
      { id: 'loft-1', name: 'Loft A', address: '123 Main St' },
      { id: 'loft-2', name: 'Loft B', address: '456 Oak Ave' },
      { id: 'loft-3', name: 'Loft C', address: '789 Pine Rd' }
    ],
    tasks: [
      { 
        id: 'task-1', 
        title: 'Task with Loft', 
        description: 'Task description',
        status: 'todo',
        loft_id: 'loft-1',
        assigned_to: 'member-1',
        user_id: 'admin-1'
      },
      { 
        id: 'task-2', 
        title: 'Task without Loft', 
        description: 'Another task',
        status: 'in_progress',
        loft_id: null,
        assigned_to: 'member-1',
        user_id: 'admin-1'
      },
      { 
        id: 'task-3', 
        title: 'Orphaned Task', 
        description: 'Task with deleted loft',
        status: 'todo',
        loft_id: 'deleted-loft-id',
        assigned_to: 'member-1',
        user_id: 'admin-1'
      }
    ]
  }
  
  console.log('✅ Test environment setup complete')
}