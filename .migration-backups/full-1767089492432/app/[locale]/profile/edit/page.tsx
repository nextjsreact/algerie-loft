import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditProfilePage } from '@/components/profile/edit-profile-page'

export default async function EditProfilePageRoute({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/${locale}/login`)
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    role: user.user_metadata?.role || 'client',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    phone: user.user_metadata?.phone || ''
  }

  return <EditProfilePage user={userProfile} locale={locale} />
}