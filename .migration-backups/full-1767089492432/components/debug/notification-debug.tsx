'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useNotifications } from '@/components/providers/notification-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, TestTube, Volume2, Database, Wifi, Shield } from 'lucide-react'

interface NotificationDebugProps {
  userId: string
}

export function NotificationDebug({ userId }: NotificationDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const { unreadCount, refreshNotifications } = useNotifications()
  const supabase = createClient()

  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Check database connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('notifications')
        .select('count')
        .limit(1)
      
      results.databaseConnection = {
        success: !connectionError,
        error: connectionError?.message
      }

      // Test 2: Check notifications table structure
      const { data: tableStructure, error: structureError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1)
      
      results.tableStructure = {
        success: !structureError,
        error: structureError?.message,
        columns: tableStructure?.[0] ? Object.keys(tableStructure[0]) : []
      }

      // Test 3: Check user's notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      results.userNotifications = {
        success: !userError,
        error: userError?.message,
        count: userNotifications?.length || 0,
        notifications: userNotifications || []
      }

      // Test 4: Check unread count
      const { count: unreadCountDb, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      
      results.unreadCount = {
        success: !countError,
        error: countError?.message,
        dbCount: unreadCountDb,
        contextCount: unreadCount
      }

      // Test 5: Test realtime connection
      const channel = supabase.channel('test-channel')
      const realtimeTest = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000)
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve(true)
          }
        })
      })
      
      results.realtimeConnection = {
        success: await realtimeTest
      }
      
      channel.unsubscribe()

    } catch (error: any) {
      results.generalError = error.message
    }

    setDebugInfo(results)
    setIsLoading(false)
  }

  const createTestNotification = async () => {
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          title: 'Test Notification',
          message: 'This is a test notification created for debugging',
          type: 'info'
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log('Test notification created via API:', result)
        await refreshNotifications()
      } else {
        console.error('Error creating test notification via API:', result)
      }
    } catch (error) {
      console.error('Failed to create test notification via API:', error)
    }
  }

  const createDirectTestNotification = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Direct Test Notification',
          message: 'This is a direct test notification created for debugging',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error creating direct test notification:', error)
      } else {
        console.log('Direct test notification created:', data)
        await refreshNotifications()
      }
    } catch (error) {
      console.error('Failed to create direct test notification:', error)
    }
  }

  const createTaskAssignmentTest = async () => {
    try {
      const response = await fetch('/api/test-task-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToUserId: userId
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log('Task assignment notification created:', result)
        await refreshNotifications()
      } else {
        console.error('Error creating task assignment notification:', result)
      }
    } catch (error) {
      console.error('Failed to create task assignment notification:', error)
    }
  }

  const testRLSPolicies = async () => {
    try {
      const response = await fetch('/api/test-rls-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      console.log('RLS test results:', result)
      
      if (response.ok) {
        setDebugInfo(prev => ({
          ...prev,
          rlsTest: result.tests
        }))
        await refreshNotifications()
      }
    } catch (error) {
      console.error('Failed to test RLS policies:', error)
    }
  }

  const testNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(error => {
        console.error('Error playing sound:', error)
      })
    } catch (error) {
      console.error('Error creating audio:', error)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Diagnostic des Notifications
          </CardTitle>
          <CardDescription>
            Outils de débogage pour le système de notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runDiagnostics} disabled={isLoading}>
              {isLoading ? 'Test en cours...' : 'Lancer les tests'}
            </Button>
            <Button onClick={createTestNotification} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Test via API
            </Button>
            <Button onClick={createDirectTestNotification} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Test direct DB
            </Button>
            <Button onClick={createTaskAssignmentTest} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Test assignation tâche
            </Button>
            <Button onClick={testRLSPolicies} variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Test RLS
            </Button>
            <Button onClick={() => window.location.href = '/notifications'} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Voir notifications
            </Button>
            <Button onClick={testNotificationSound} variant="outline">
              <Volume2 className="h-4 w-4 mr-2" />
              Tester le son
            </Button>
            <Badge variant="secondary">
              Notifications non lues: {unreadCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {Object.keys(debugInfo).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Database Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                Connexion Base de Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.databaseConnection?.success ? 'default' : 'destructive'}>
                {debugInfo.databaseConnection?.success ? 'OK' : 'ERREUR'}
              </Badge>
              {debugInfo.databaseConnection?.error && (
                <p className="text-sm text-red-600 mt-2">{debugInfo.databaseConnection.error}</p>
              )}
            </CardContent>
          </Card>

          {/* Table Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                Structure Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.tableStructure?.success ? 'default' : 'destructive'}>
                {debugInfo.tableStructure?.success ? 'OK' : 'ERREUR'}
              </Badge>
              {debugInfo.tableStructure?.columns && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">Colonnes:</p>
                  <p className="text-xs">{debugInfo.tableStructure.columns.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4" />
                Notifications Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.userNotifications?.success ? 'default' : 'destructive'}>
                {debugInfo.userNotifications?.success ? 'OK' : 'ERREUR'}
              </Badge>
              <p className="text-sm mt-2">
                Total: {debugInfo.userNotifications?.count || 0}
              </p>
              {debugInfo.userNotifications?.notifications?.slice(0, 3).map((notif: any) => (
                <div key={notif.id} className="text-xs bg-gray-50 p-2 rounded mt-1">
                  <strong>{notif.title}</strong>
                  <br />
                  {notif.message}
                  <br />
                  <span className="text-gray-500">
                    {new Date(notif.created_at).toLocaleString()} - 
                    {notif.is_read ? ' Lu' : ' Non lu'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Unread Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4" />
                Compteur Non Lues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.unreadCount?.success ? 'default' : 'destructive'}>
                {debugInfo.unreadCount?.success ? 'OK' : 'ERREUR'}
              </Badge>
              <div className="text-sm mt-2">
                <p>Base de données: {debugInfo.unreadCount?.dbCount ?? 'N/A'}</p>
                <p>Context React: {debugInfo.unreadCount?.contextCount ?? 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Realtime Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4" />
                Connexion Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.realtimeConnection?.success ? 'default' : 'destructive'}>
                {debugInfo.realtimeConnection?.success ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
              </Badge>
            </CardContent>
          </Card>

          {/* RLS Test Results */}
          {debugInfo.rlsTest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Test RLS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-xs font-medium">Service Role:</span>
                  <Badge variant={debugInfo.rlsTest.serviceRole?.success ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.rlsTest.serviceRole?.success ? 'OK' : 'ERREUR'}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs font-medium">Client Normal:</span>
                  <Badge variant={debugInfo.rlsTest.regularClient?.success ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.rlsTest.regularClient?.success ? 'OK' : 'ERREUR'}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs font-medium">Lecture:</span>
                  <Badge variant={debugInfo.rlsTest.readTest?.success ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.rlsTest.readTest?.success ? 'OK' : 'ERREUR'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}