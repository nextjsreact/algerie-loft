'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Users, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  User,
  Bell
} from 'lucide-react'

export default function TestConversationsPage() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }))
    try {
      await testFn()
      setTestResults(prev => ({ ...prev, [testName]: 'success' }))
      toast.success(`✅ ${testName} passed`)
    } catch (error) {
      console.error(`Test failed: ${testName}`, error)
      setTestResults(prev => ({ ...prev, [testName]: 'error' }))
      toast.error(`❌ ${testName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testDatabaseConnection = async () => {
    const response = await fetch('/api/conversations/debug')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    console.log('Database debug info:', data)
    
    // Check if all required tables exist
    const requiredTables = ['conversations', 'conversation_participants', 'messages', 'profiles']
    const missingTables = requiredTables.filter(table => !data.tables[table]?.exists)
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}. Please run the database schema.`)
    }
    
    if (!data.foreignKeys.test_relationship?.works) {
      throw new Error(`Foreign key relationship test failed: ${data.foreignKeys.test_relationship?.error}`)
    }
  }

  const testUserSearch = async () => {
    const response = await fetch('/api/users/search?q=test')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    console.log('User search test:', data)
  }

  const testCreateDirectConversation = async () => {
    // This would need a real user ID to test properly
    // For now, just test the API endpoint structure
    const response = await fetch('/api/conversations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'direct',
        participant_ids: ['test-user-id'] // This would fail but tests the endpoint
      })
    })
    
    // We expect this to fail with 500 due to invalid user ID, but not 404
    if (response.status === 404) {
      throw new Error('API endpoint not found')
    }
    console.log('Create conversation endpoint test:', response.status)
  }

  const testSendMessage = async () => {
    const response = await fetch('/api/conversations/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: 'test-id',
        content: 'Test message'
      })
    })
    
    // We expect this to fail with 500 due to invalid conversation ID, but not 404
    if (response.status === 404) {
      throw new Error('API endpoint not found')
    }
    console.log('Send message endpoint test:', response.status)
  }

  const testRealtimeConnection = async () => {
    // Test if we can create a Supabase client
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    
    // Test basic connection
    const { data, error } = await supabase.from('conversations').select('count').limit(1)
    if (error && error.code === '42P01') {
      throw new Error('Conversations table does not exist. Please run the database schema.')
    }
    console.log('Realtime connection test:', { data, error })
  }

  const testTeamPermissions = async () => {
    const response = await fetch('/api/conversations/test-permissions')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    console.log('Team permissions test:', data)
    
    // Validate the response structure
    if (!data.currentUser || !Array.isArray(data.teams) || !Array.isArray(data.canMessage)) {
      throw new Error('Invalid permissions response structure')
    }
    
    // Log useful info
    console.log(`Current user: ${data.currentUser.name} (${data.currentUser.role})`)
    console.log(`Teams: ${data.teams.length}`)
    console.log(`Can message: ${data.canMessage.length} users`)
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults({})
    
    const tests = [
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'User Search API', fn: testUserSearch },
      { name: 'Create Conversation API', fn: testCreateDirectConversation },
      { name: 'Send Message API', fn: testSendMessage },
      { name: 'Realtime Connection', fn: testRealtimeConnection },
      { name: 'Team Permissions', fn: testTeamPermissions }
    ]

    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunningTests(false)
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Run</Badge>
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conversations System Test</h1>
        <p className="text-muted-foreground">
          Test all components of the conversations system to ensure everything is working properly.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Runner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Tests
            </CardTitle>
            <CardDescription>
              Run comprehensive tests to verify the conversations system is working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAllTests} 
              disabled={isRunningTests}
              className="mb-4"
            >
              {isRunningTests && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Run All Tests
            </Button>

            <div className="space-y-3">
              {[
                { name: 'Database Connection', description: 'Test connection to conversations API' },
                { name: 'User Search API', description: 'Test user search functionality' },
                { name: 'Create Conversation API', description: 'Test conversation creation endpoint' },
                { name: 'Send Message API', description: 'Test message sending endpoint' },
                { name: 'Realtime Connection', description: 'Test Supabase realtime connection' },
                { name: 'Team Permissions', description: 'Test team-based messaging restrictions' }
              ].map((test) => (
                <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults[test.name])}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(testResults[test.name])}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Manual Tests
            </CardTitle>
            <CardDescription>
              Test the user interface components manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.location.href = '/conversations'}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Test Conversations Page</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Visit the conversations page to test the UI
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => {
                  toast.info('Try creating a new conversation from the conversations page')
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Test New Conversation</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Test creating direct messages and group chats
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => {
                  toast.info('Send messages in an existing conversation to test real-time updates')
                }}
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span className="font-medium">Test Real-time Messages</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Test sending and receiving messages in real-time
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => {
                  toast.info('Check if message notifications appear with sound')
                }}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Test Notifications</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Test message notifications and sounds
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              If tests are failing, follow these setup steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Database Schema</h4>
              <p className="text-sm text-muted-foreground">
                Run the conversations schema in your Supabase SQL editor:
              </p>
              <code className="block p-2 bg-muted rounded text-xs">
                database/conversations-schema.sql
              </code>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Enable Realtime</h4>
              <p className="text-sm text-muted-foreground">
                Enable realtime for these tables in Supabase:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-4">
                <li>conversations</li>
                <li>messages</li>
                <li>conversation_participants</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Test with Multiple Users</h4>
              <p className="text-sm text-muted-foreground">
                Create multiple user accounts to test conversations between different users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}