'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugProfilePage() {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/partner/debug-profile')
      const data = await response.json()
      setProfileData(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre profil partenaire?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch('/api/partner/debug-profile', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (response.ok) {
        alert('Profil partenaire supprimé avec succès!')
        fetchProfile()
      } else {
        alert('Erreur: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to delete profile:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug - Profil Partenaire</CardTitle>
            <CardDescription>
              Informations sur votre compte et profil partenaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Utilisateur</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(profileData?.user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Profil (profiles table)</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(profileData?.profile, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Profil Partenaire (partner_profiles table)</h3>
              {profileData?.hasPartnerProfile ? (
                <>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto mb-4">
                    {JSON.stringify(profileData?.partnerProfile, null, 2)}
                  </pre>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                    <p className="text-yellow-800">
                      <strong>Statut actuel:</strong> {profileData?.partnerStatus}
                    </p>
                  </div>
                  <Button 
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="destructive"
                  >
                    {deleting ? 'Suppression...' : 'Supprimer le profil partenaire'}
                  </Button>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <p className="text-green-800">
                    Aucun profil partenaire trouvé. Vous pouvez vous inscrire comme partenaire.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button onClick={fetchProfile} variant="outline">
                Rafraîchir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
