'use client'

import React, { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Send, Paperclip, X, Download, FileText, Image as ImageIcon, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ExtendedBookingMessage } from '@/lib/types-notification-extensions'
import { useBookingMessages } from '@/hooks/use-booking-messages'

interface MessageThreadProps {
  bookingId: string
  currentUserId: string
  currentUserRole: 'client' | 'partner'
  bookingDetails?: {
    loft_name: string
    client_name: string
    partner_name: string
    check_in: string
    check_out: string
  }
  className?: string
}

export function MessageThread({
  bookingId,
  currentUserId,
  currentUserRole,
  bookingDetails,
  className
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showTyping, setShowTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    loading,
    error,
    sendMessage,
    fetchMessages,
    uploadFile
  } = useBookingMessages(bookingId)

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() && !selectedFile) return

    try {
      let attachmentData = null
      
      if (selectedFile) {
        setIsUploading(true)
        attachmentData = await uploadFile(selectedFile)
      }

      await sendMessage({
        message: newMessage.trim(),
        message_type: selectedFile ? 'attachment' : 'text',
        attachment_url: attachmentData?.url,
        attachment_name: attachmentData?.name,
        attachment_size: attachmentData?.size
      })

      setNewMessage('')
      setSelectedFile(null)
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />
    }
    
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const groupMessagesByDate = (messages: ExtendedBookingMessage[]) => {
    const groups: { [key: string]: ExtendedBookingMessage[] } = {}
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  if (loading && messages.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">Failed to load conversation</p>
            <Button variant="outline" size="sm" onClick={() => fetchMessages()}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Conversation
        </CardTitle>
        {bookingDetails && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{bookingDetails.loft_name}</p>
            <p>
              {format(new Date(bookingDetails.check_in), 'MMM dd')} - {format(new Date(bookingDetails.check_out), 'MMM dd, yyyy')}
            </p>
            <p>
              Between {currentUserRole === 'client' ? 'you' : bookingDetails.client_name} and{' '}
              {currentUserRole === 'partner' ? 'you' : bookingDetails.partner_name}
            </p>
          </div>
        )}
      </CardHeader>

      <Separator />

      {/* Messages */}
      <ScrollArea className="flex-1 h-96 p-4">
        <div className="space-y-4">
          {Object.keys(messageGroups).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No messages yet</p>
              <p className="text-xs text-muted-foreground">
                Start a conversation about your booking
              </p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-4 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground bg-background px-2">
                    {format(new Date(date), 'MMMM dd, yyyy')}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dayMessages.map((message, index) => {
                    const isOwnMessage = message.sender?.id === currentUserId
                    const showAvatar = index === 0 || 
                      dayMessages[index - 1]?.sender?.id !== message.sender?.id
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {!isOwnMessage && (
                          <div className="flex flex-col items-center">
                            {showAvatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender?.avatar_url} />
                                <AvatarFallback>
                                  {message.sender?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-8 w-8" />
                            )}
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-3 py-2 relative group',
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.message_type === 'attachment' ? (
                            <div className="space-y-2">
                              {message.message && (
                                <p className="text-sm">{message.message}</p>
                              )}
                              <div className={cn(
                                'flex items-center gap-2 p-2 rounded border',
                                isOwnMessage 
                                  ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                                  : 'bg-background border-border'
                              )}>
                                {getFileIcon(message.attachment_name || '')}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {message.attachment_name}
                                  </p>
                                  {message.attachment_size && (
                                    <p className="text-xs opacity-70">
                                      {formatFileSize(message.attachment_size)}
                                    </p>
                                  )}
                                </div>
                                {message.attachment_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(message.attachment_url, '_blank')}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          )}
                          
                          {/* Message timestamp */}
                          <div className={cn(
                            'absolute -bottom-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity',
                            isOwnMessage ? 'right-0' : 'left-0'
                          )}>
                            <span className="text-muted-foreground">
                              {format(new Date(message.created_at), 'HH:mm')}
                            </span>
                            {!message.is_read && !isOwnMessage && (
                              <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {isOwnMessage && (
                          <div className="flex flex-col items-center">
                            {showAvatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender?.avatar_url} />
                                <AvatarFallback>
                                  {message.sender?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-8 w-8" />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        {selectedFile && (
          <div className="mb-3 p-3 bg-muted rounded-lg flex items-center gap-3">
            {getFileIcon(selectedFile.name)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={removeSelectedFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isUploading}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            type="submit"
            size="sm"
            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </Card>
  )
}