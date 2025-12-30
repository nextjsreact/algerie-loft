'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Search, Users, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  full_name: string
  email: string
  role?: string
}

interface NewConversationPageClientProps {
  currentUserId: string
}

export function NewConversationPageClient({ currentUserId }: NewConversationPageClientProps) {
  const router = useRouter()
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct')
  const [conversationName, setConversationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users)
      } else {
        toast.error('Failed to search users')
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    searchUsers(value)
  }

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const createConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (conversationType === 'group' && !conversationName.trim()) {
      toast.error('Please enter a name for the group conversation')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: conversationType,
          name: conversationType === 'group' ? conversationName.trim() : undefined,
          participant_ids: selectedUsers.map(u => u.id)
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        toast.success('Conversation created successfully!')
        router.push(`/conversations/${conversation.id}`)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to create conversation')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={conversationType} onValueChange={(value: 'direct' | 'group') => setConversationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct Message</SelectItem>
              <SelectItem value="group">Group Conversation</SelectItem>
            </SelectContent>
          </Select>
          
          {conversationType === 'group' && (
            <div className="mt-4">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {isSearching && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                    onClick={() => addUser(user)}
                  >
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    {user.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div>
                <Label>Selected Participants ({selectedUsers.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.full_name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeUser(user.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={createConversation}
          disabled={isCreating || selectedUsers.length === 0}
          className="flex-1"
        >
          {isCreating ? 'Creating...' : 'Create Conversation'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isCreating}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}