import { requireAuth } from "@/lib/auth"
import { NotificationDebug } from "@/components/debug/notification-debug"

export default async function DebugNotificationsPage() {
  const session = await requireAuth()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Notifications</h1>
      <NotificationDebug userId={session.user.id} />
    </div>
  )
}