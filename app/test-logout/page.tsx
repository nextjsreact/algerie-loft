'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/lib/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import Link from 'next/link';

export default function TestLogoutPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleServerLogout = async () => {
    console.log('Testing server-side logout function...');
    await logout();
  };

  const handleClientLogout = async () => {
    console.log('Testing client-side logout...');
    await supabase.auth.signOut();
    // Manual redirect to public site
    window.location.href = '/fr/public';
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Test de Déconnexion</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">État de la Session</h2>
          {session ? (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">✅ Utilisateur connecté</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-600 font-semibold">❌ Utilisateur non connecté</p>
              <Link
                href="/fr/login"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>

        {session && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tests de Déconnexion</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Déconnexion Server-Side (lib/auth.ts)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Utilise la fonction logout() qui devrait rediriger vers /fr/public
                </p>
                <button
                  onClick={handleServerLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Test Server Logout
                </button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Déconnexion Client-Side</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Utilise supabase.auth.signOut() avec redirection manuelle
                </p>
                <button
                  onClick={handleClientLogout}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Test Client Logout
                </button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. LogoutButton Component</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Utilise useSessionManager avec logoutFromBoth()
                </p>
                <LogoutButton 
                  locale="fr"
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Test LogoutButton
                </LogoutButton>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions de Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Assurez-vous d'être connecté avant de tester</li>
            <li>Testez chaque méthode de déconnexion</li>
            <li>Vérifiez que vous êtes redirigé vers <strong>/fr/public</strong> (site web)</li>
            <li>Vérifiez que vous n'êtes PAS redirigé vers /fr/login</li>
          </ol>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold mb-2">Liens de Navigation</h3>
          <div className="space-x-4">
            <Link href="/fr/public" className="text-blue-600 hover:underline">
              → Site Web Public
            </Link>
            <Link href="/fr/dashboard" className="text-blue-600 hover:underline">
              → Dashboard (nécessite connexion)
            </Link>
            <Link href="/fr/login" className="text-blue-600 hover:underline">
              → Page de Connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}