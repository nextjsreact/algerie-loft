'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugNotificationsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get session
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()

      // Get notifications from API
      const notificationsResponse = await fetch('/api/notifications')
      const notificationsData = await notificationsResponse.json()

      // Get unread count
      const unreadResponse = await fetch('/api/notifications/unread-count')
      const unreadData = await unreadResponse.json()

      setData({
        session: sessionData,
        notifications: notificationsData,
        unreadCount: unreadData
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteAll = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes vos notifications?')) {
      return
    }

    try {
      const response = await fetch('/api/notifications/delete-all', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Toutes les notifications ont été supprimées!')
        fetchData()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug - Notifications</CardTitle>
            <CardDescription>
              Informations détaillées sur vos notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Session utilisateur</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(data?.session, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Compteur de notifications non lues</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(data?.unreadCount, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Notifications (API)</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-96">
                {JSON.stringify(data?.notifications, null, 2)}
              </pre>
            </div>

            <div className="pt-4 flex gap-4">
              <Button onClick={fetchData} variant="outline">
                Rafraîchir
              </Button>
              <Button onClick={handleDeleteAll} variant="destructive">
                Supprimer toutes les notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
