import { requireAuth } from "@/lib/auth";
import { getSimpleUserConversations } from "@/lib/services/conversations-simple";
import { WhatsAppLayout } from "@/components/conversations/whatsapp-layout";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  try {
    // Charger toutes les conversations pour la sidebar
    const conversations = await getSimpleUserConversations(session.user.id);

    return (
      <WhatsAppLayout
        conversations={conversations}
        currentUserId={session.user.id}
        selectedConversationId={id}
      />
    );
  } catch (error) {
    console.error("Error loading conversation:", error);

    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Conversation</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading this conversation. This might be due to a database issue.
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm text-left mb-4">
            <p className="font-medium mb-2">How to Fix:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Run the RLS fix script:{" "}
                <code className="bg-background px-1 rounded">
                  node scripts/fix-conversations-rls.js
                </code>
              </li>
              <li>Refresh the page.</li>
              <li>If the problem persists, check the database connection.</li>
              <li>Contact support if the issue is not resolved.</li>
            </ol>
          </div>
          <Button asChild>
            <Link href="/conversations">Back to Conversations</Link>
          </Button>
        </div>
      </div>
    );
  }
}
