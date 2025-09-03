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
  onBack?: () => void
  onCreateConversation?: (userIds: string[], isGroup: boolean, groupName?: string) => void
}

export function ModernNewConversation({ onBack, onCreateConversation }: ModernNewConversationProps) {
  const t = useTranslations('conversations')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groupName, setGroupName] = useState('')
  const [activeTab, setActiveTab] = useState('direct')

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) return
    
    const userIds = selectedUsers.map(user => user.id)
    const isGroup = activeTab === 'group'
    
    onCreateConversation?.(userIds, isGroup, isGroup ? groupName : undefined)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                    {user.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                      setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
                    }} />
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button 
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || (activeTab === 'group' && !groupName.trim())}
            className="w-full"
          >
            {t('startConversation')}
          </Button>
        </div>
      </div>
    </div>
  )
}