'use client'

import { useState, useEffect } from 'react'
import { Search, X, Users, MessageSquare, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface ModernNewConversationProps {
  currentUserId: string
  showBackButton?: boolean
  onBack?: () => void
  onCreateConversation?: (userIds: string[], isGroup: boolean, groupName?: string) => void
}

export function ModernNewConversation({ currentUserId, showBackButton, onBack, onCreateConversation }: ModernNewConversationProps) {
  const t = useTranslations('conversations')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groupName, setGroupName] = useState('')
  const [activeTab, setActiveTab] = useState('direct')
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      
      if (response.ok) {
        const searchResults = await response.json()
        setUsers(searchResults.map((user: any) => ({
          id: user.id,
          name: user.full_name || user.name || 'Nom non disponible',
          email: user.email
        })))
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Trigger search when searchQuery changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers(searchQuery)
    } else {
      setUsers([])
    }
  }, [searchQuery])

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setSearchQuery('')
    setUsers([])
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return
    if (activeTab === 'group' && !groupName.trim()) return
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          name: activeTab === 'group' ? groupName.trim() : undefined,
          participant_ids: selectedUsers.map(u => u.id)
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        window.location.href = `/conversations/${conversation.id}`
      } else {
        console.error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack || (() => window.history.back())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-lg font-semibold">{t('newConversation')}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">{t('direct')}</TabsTrigger>
            <TabsTrigger value="group">{t('group')}</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchByNameOrEmail')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {isSearching && (
              <div className="text-sm text-muted-foreground">Recherche...</div>
            )}

            <div className="space-y-2">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => addUser(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Utilisateur sélectionné :</div>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeUser(user.id)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <Input
              placeholder={t('groupName')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchByNameOrEmail')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {isSearching && (
              <div className="text-sm text-muted-foreground">Recherche...</div>
            )}

            <div className="space-y-2">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => addUser(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                    {user.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeUser(user.id)} />
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button 
            onClick={handleCreateConversation}
            disabled={isCreating || selectedUsers.length === 0 || (activeTab === 'group' && !groupName.trim())}
            className="w-full"
          >
            {isCreating ? 'Création...' : t('startConversation')}
          </Button>
        </div>
      </div>
    </div>
  )
}