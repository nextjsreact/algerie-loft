import { requireAuth } from "@/lib/auth"
import { getSimpleUserConversations } from "@/lib/services/conversations-simple"
import { WhatsAppLayout } from "@/components/conversations/whatsapp-layout"
import { MessagesSquare, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ConversationsPage() {
  const session = await requireAuth()
  
  let conversations: any[] = []
  let hasError = false
  let errorMessage = ''
  
  try {
    // Use simplified service to avoid RLS recursion issues
    conversations = await getSimpleUserConversations(session.user.id)
  } catch (error) {
    console.error('Error loading conversations:', error)
    hasError = true
    errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center max-w-md">
          <MessagesSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {errorMessage.includes('infinite recursion') || errorMessage.includes('RLS policy')
              ? 'RLS Policy Fix Required'
              : errorMessage.includes('relation') || errorMessage.includes('table')
              ? 'Conversations System Setup Required'
              : 'Conversations Error'
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {errorMessage.includes('infinite recursion') || errorMessage.includes('RLS policy')
              ? 'The conversations system has RLS policy infinite recursion issues that need to be fixed.'
              : errorMessage.includes('relation') || errorMessage.includes('table') 
              ? 'The conversations system needs to be set up in your database.'
              : 'There was an error loading conversations.'
            }
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm text-left">
            <p className="font-medium mb-2">
              {errorMessage.includes('infinite recursion') || errorMessage.includes('RLS policy')
                ? 'To fix RLS policies:'
                : 'To enable conversations:'
              }
            </p>
            <ol className="list-decimal list-inside space-y-1">
              {errorMessage.includes('infinite recursion') || errorMessage.includes('RLS policy') ? (
                <>
                  <li>Run: <code className="bg-background px-1 rounded">node scripts/fix-conversations-rls.js</code></li>
                  <li>Copy the SQL output to your Supabase SQL Editor</li>
                  <li>Execute the SQL script to fix RLS policies</li>
                  <li>Refresh this page</li>
                </>
              ) : (
                <>
                  <li>Run: <code className="bg-background px-1 rounded">node scripts/apply-conversations-schema.js</code></li>
                  <li>Copy the SQL output to your Supabase SQL Editor</li>
                  <li>Execute the SQL script</li>
                  <li>Refresh this page</li>
                </>
              )}
            </ol>
          </div>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Error details:</strong> {errorMessage}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Normal render with conversations data using WhatsApp layout
  return (
    <WhatsAppLayout 
      conversations={conversations}
      currentUserId={session.user.id}
    />
  )
}
