import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { UserProfilePage } from '@/components/profile/user-profile-page'

export default async function ProfilePage({
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

  // Fetch full profile including telegram_chat_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, telegram_chat_id')
    .eq('id', user.id)
    .single()

  const userProfile = {
    id: user.id,
    email: user.email || '',
    full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
    role: user.user_metadata?.role || 'client',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    phone: user.user_metadata?.phone || '',
    created_at: user.created_at,
    telegram_chat_id: profile?.telegram_chat_id || '',
  }

  return <UserProfilePage user={userProfile} locale={locale} />
}