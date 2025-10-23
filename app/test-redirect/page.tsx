'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function TestRedirectPage() {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Test de Redirection</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">État de la Session</h2>
          {session ? (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">✅ Utilisateur connecté</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Se déconnecter
              </button>
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

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tests de Redirection</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pages Racine (doivent rediriger selon l'état de connexion)</h3>
              <div className="space-x-4">
                <Link href="/fr" className="text-blue-600 hover:underline">
                  /fr (doit aller vers home si connecté, public sinon)
                </Link>
                <Link href="/en" className="text-blue-600 hover:underline">
                  /en
                </Link>
                <Link href="/ar" className="text-blue-600 hover:underline">
                  /ar
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Pages Publiques</h3>
              <div className="space-x-4">
                <Link href="/fr/public" className="text-blue-600 hover:underline">
                  /fr/public
                </Link>
                <Link href="/fr/galerie-styles" className="text-blue-600 hover:underline">
                  /fr/galerie-styles
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Pages Protégées</h3>
              <div className="space-x-4">
                <Link href="/fr/dashboard" className="text-blue-600 hover:underline">
                  /fr/dashboard
                </Link>
                <Link href="/fr/lofts" className="text-blue-600 hover:underline">
                  /fr/lofts
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions de Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Si vous n'êtes pas connecté, connectez-vous via le bouton ci-dessus</li>
            <li>Après connexion, vous devriez être redirigé vers le dashboard</li>
            <li>Testez les liens "Pages Racine" - ils doivent aller vers le dashboard</li>
            <li>Déconnectez-vous et testez à nouveau - ils doivent aller vers /public</li>
          </ol>
        </div>
      </div>
    </div>
  );
}