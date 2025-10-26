'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { BookingMessage } from '@/lib/types'
import { useBookingMessages } from '@/hooks/use-booking-messages'

interface BookingMessagesProps {
  bookingId: string
  currentUserId: string
  className?: string
}

export function BookingMessages({
  bookingId,
  currentUserId,
  className
}: BookingMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  if (loading && messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Failed to load messages</p>
          <Button variant="outline" size="sm" onClick={() => fetchMessages()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-96 border rounded-lg', className)}>
      {/* Messages Header */}
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-medium">Messages</h3>
        <p className="text-xs text-muted-foreground">
          Communicate with your {currentUserId === messages[0]?.sender?.id ? 'guest' : 'host'}
        </p>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation with your {currentUserId === messages[0]?.sender?.id ? 'guest' : 'host'}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender?.id === currentUserId
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>
                        {message.sender?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-3 py-2',
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
                        <div className="flex items-center gap-2 p-2 rounded border bg-background/10">
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
                      <p className="text-sm">{message.message}</p>
                    )}
                    
                    <div className={cn(
                      'flex items-center gap-2 mt-1',
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    )}>
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {!message.is_read && !isOwnMessage && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>
                        {message.sender?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t">
        {selectedFile && (
          <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
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
              className="h-6 w-6 p-0"
              onClick={removeSelectedFile}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isUploading}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-3 w-3" />
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
    </div>
  )
}