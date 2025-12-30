import { getSessionReadOnly } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TestAvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSessionReadOnly()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Avatar Display</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium">Email:</span> {session.user.email}
          </div>
          <div>
            <span className="font-medium">Full Name:</span> {session.user.full_name || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Role:</span> {session.user.role}
          </div>
          <div>
            <span className="font-medium">Avatar URL:</span> {session.user.avatar_url || 'Not set'}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Avatar Display Test</h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            L'avatar devrait s'afficher dans le header (mobile et desktop) et dans la sidebar (si visible).
            La couleur de l'avatar dépend du rôle utilisateur :
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 space-y-1">
            <li>• <span className="font-medium">Client:</span> Bleu</li>
            <li>• <span className="font-medium">Partenaire:</span> Vert</li>
            <li>• <span className="font-medium">Admin/Manager/Executive:</span> Rouge</li>
          </ul>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Sidebar Visibility Test</h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            {session.user.role === 'client' ? (
              "En tant que client, la sidebar admin ne devrait PAS être visible. Vous devriez voir le header desktop à la place."
            ) : (
              "En tant qu'admin/manager/executive, la sidebar devrait être visible avec votre avatar en bas."
            )}
          </p>
        </div>
      </div>
    </div>
  )
}