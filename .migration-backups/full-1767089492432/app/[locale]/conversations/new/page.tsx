import { requireAuth } from "@/lib/auth"
import { ModernNewConversation } from "@/components/conversations/modern-new-conversation"

export default async function NewConversationPage() {
  const session = await requireAuth()
  
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ModernNewConversation 
        currentUserId={session.user.id} 
        showBackButton={true}
      />
    </div>
  )
}