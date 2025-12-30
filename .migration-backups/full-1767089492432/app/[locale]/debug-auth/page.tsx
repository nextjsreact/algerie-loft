import { getSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from '@/utils/supabase/server'

export default async function DebugAuthPage() {
  const session = await getSession()
  
  // Récupérer aussi les données directement de Supabase pour comparaison
  let supabaseUserData = null
  let supabaseProfileData = null
  
  if (session) {
    try {
      const supabase = await createClient(true) // Service role
      
      // Données utilisateur auth
      const { data: authUser } = await supabase.auth.admin.getUserById(session.user.id)
      supabaseUserData = authUser.user
      
      // Données profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      supabaseProfileData = profile
      
    } catch (error) {
      console.error('Erreur récupération données Supabase:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Diagnostic Authentification</h1>
      
      {/* Session actuelle */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Session Actuelle (via getSession())</CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Nom:</strong> {session.user.full_name || 'Non défini'}</p>
              <p><strong>Rôle:</strong> <span className="bg-red-100 px-2 py-1 rounded font-bold">{session.user.role}</span></p>
              <p><strong>Créé le:</strong> {session.user.created_at}</p>
              <p><strong>Mis à jour:</strong> {session.user.updated_at || 'Jamais'}</p>
              <p><strong>Token présent:</strong> {session.token ? '✅ Oui' : '❌ Non'}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Aucune session trouvée</p>
          )}
        </CardContent>
      </Card>

      {/* Données Supabase Auth */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 Données Supabase Auth (directes)</CardTitle>
        </CardHeader>
        <CardContent>
          {supabaseUserData ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>ID:</strong> {supabaseUserData.id}</p>
              <p><strong>Email:</strong> {supabaseUserData.email}</p>
              <p><strong>Email confirmé:</strong> {supabaseUserData.email_confirmed_at ? '✅ Oui' : '❌ Non'}</p>
              <p><strong>Dernière connexion:</strong> {supabaseUserData.last_sign_in_at || 'Jamais'}</p>
              <p><strong>Métadonnées:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(supabaseUserData.user_metadata, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">Aucune donnée auth récupérée</p>
          )}
        </CardContent>
      </Card>

      {/* Données Profile */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Données Profile (table profiles)</CardTitle>
        </CardHeader>
        <CardContent>
          {supabaseProfileData ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>ID:</strong> {supabaseProfileData.id}</p>
              <p><strong>Email:</strong> {supabaseProfileData.email}</p>
              <p><strong>Nom complet:</strong> {supabaseProfileData.full_name || 'Non défini'}</p>
              <p><strong>Rôle:</strong> <span className="bg-green-100 px-2 py-1 rounded font-bold">{supabaseProfileData.role}</span></p>
              <p><strong>Créé le:</strong> {supabaseProfileData.created_at}</p>
              <p><strong>Mis à jour:</strong> {supabaseProfileData.updated_at}</p>
              <p><strong>Données complètes:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(supabaseProfileData, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-red-600">❌ Aucun profil trouvé dans la table profiles</p>
          )}
        </CardContent>
      </Card>

      {/* Comparaison */}
      <Card>
        <CardHeader>
          <CardTitle>⚖️ Comparaison et Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session && supabaseProfileData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Session (getSession)</h4>
                    <p className="text-sm">Rôle: <span className="bg-red-100 px-1 rounded">{session.user.role}</span></p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Base de données</h4>
                    <p className="text-sm">Rôle: <span className="bg-green-100 px-1 rounded">{supabaseProfileData.role}</span></p>
                  </div>
                </div>
                
                {session.user.role !== supabaseProfileData.role && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded">
                    <h4 className="font-semibold text-red-800">🚨 PROBLÈME DÉTECTÉ</h4>
                    <p className="text-red-700">
                      Le rôle dans la session ({session.user.role}) ne correspond pas au rôle dans la base de données ({supabaseProfileData.role}).
                      Cela indique un problème de synchronisation dans la fonction getSession().
                    </p>
                  </div>
                )}
                
                {session.user.role === supabaseProfileData.role && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded">
                    <h4 className="font-semibold text-green-800">✅ RÔLES SYNCHRONISÉS</h4>
                    <p className="text-green-700">
                      Les rôles correspondent. Le problème vient peut-être d'ailleurs dans l'interface.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">Impossible de comparer - données manquantes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}