'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'client' | 'partner' | 'admin'
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'system'
  attachments?: Attachment[]
  readBy: string[]
  edited?: boolean
  editedAt?: string
}

interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'other'
  size: number
}

interface Conversation {
  id: string
  bookingId: string
  participants: Participant[]
  lastMessage?: Message
  unreadCount: number
  status: 'active' | 'archived' | 'closed'
}

interface Participant {
  id: string
  name: string
  role: 'client' | 'partner' | 'admin'
  avatar?: string
  online: boolean
  lastSeen?: string
}

interface EnhancedChatProps {
  conversationId: string
  currentUserId: string
  currentUserRole: 'client' | 'partner' | 'admin'
}

export function EnhancedChat({ conversationId, currentUserId, currentUserRole }: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [typing, setTyping] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchConversation()
    fetchMessages()
    setupWebSocket()
    
    return () => {
      // Cleanup WebSocket connection
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const setupWebSocket = () => {
    // WebSocket setup for real-time messaging
    // This would connect to your WebSocket server
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'text'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        
        // Resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    try {
      setUploading(true)
      
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('conversationId', conversationId)

        const response = await fetch('/api/conversations/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          
          // Send message with attachment
          const messageResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: `Fichier partagé: ${file.name}`,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              attachments: [data.attachment]
            })
          })

          if (messageResponse.ok) {
            const messageData = await messageResponse.json()
            setMessages(prev => [...prev, messageData.message])
          }
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      })

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent, edited: true, editedAt: new Date().toISOString() }
            : msg
        ))
        setEditingMessage(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT'
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel')) return '📊'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const emojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥', '💯', '👏']

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    height: '600px',
    display: 'flex',
    flexDirection: 'column' as const
  }

  if (!conversation) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <p style={{ color: '#6B7280' }}>Chargement de la conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
              Conversation - Réservation #{conversation.bookingId.slice(0, 8)}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {conversation.participants
                .filter(p => p.id !== currentUserId)
                .map(participant => (
                  <div key={participant.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      backgroundColor: participant.online ? '#10B981' : '#6B7280'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {participant.name} ({participant.role})
                    </span>
                  </div>
                ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              title="Informations"
            >
              ℹ️
            </button>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              title="Archiver"
            >
              📁
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        backgroundColor: '#FAFAFA'
      }}>
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId
          
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '1rem',
                gap: '0.5rem'
              }}
            >
              {!isOwn && showAvatar && (
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {message.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {!isOwn && !showAvatar && (
                <div style={{ width: '2rem', flexShrink: 0 }} />
              )}

              <div style={{
                maxWidth: '70%',
                backgroundColor: isOwn ? '#3B82F6' : 'white',
                color: isOwn ? 'white' : '#111827',
                padding: '0.75rem 1rem',
                borderRadius: isOwn ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                group: true
              }}>
                {!isOwn && showAvatar && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    marginBottom: '0.25rem',
                    opacity: 0.8
                  }}>
                    {message.senderName}
                  </div>
                )}

                {editingMessage === message.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '3rem',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => editMessage(message.id, editContent)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null)
                          setEditContent('')
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#6B7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      {message.content}
                    </div>

                    {message.attachments && message.attachments.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {message.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
                              borderRadius: '0.375rem',
                              marginBottom: '0.25rem'
                            }}
                          >
                            <span style={{ fontSize: '1.25rem' }}>
                              {getFileIcon(attachment.type)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {attachment.name}
                              </div>
                              <div style={{ fontSize: '0.625rem', opacity: 0.8 }}>
                                {formatFileSize(attachment.size)}
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(attachment.url, '_blank')}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              📥
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '0.5rem',
                      fontSize: '0.625rem',
                      opacity: 0.7
                    }}>
                      <span>
                        {formatTimestamp(message.timestamp)}
                        {message.edited && ' (modifié)'}
                      </span>
                      
                      {isOwn && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => {
                              setEditingMessage(message.id)
                              setEditContent(message.content)
                            }}
                            style={{
                              padding: '0.125rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            style={{
                              padding: '0.125rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
        
        {typing.length > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem',
            fontSize: '0.875rem',
            color: '#6B7280',
            fontStyle: 'italic'
          }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#6B7280', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#6B7280', animation: 'pulse 1.5s infinite 0.5s' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#6B7280', animation: 'pulse 1.5s infinite 1s' }} />
            </div>
            {typing.join(', ')} {typing.length === 1 ? 'écrit' : 'écrivent'}...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid #E5E7EB',
        backgroundColor: 'white'
      }}>
        {uploading && (
          <div style={{ 
            marginBottom: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#EBF8FF', 
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#3B82F6'
          }}>
            📤 Upload en cours...
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.75rem',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="Joindre un fichier"
          >
            📎
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                padding: '0.75rem',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
              title="Émojis"
            >
              😊
            </button>

            {showEmojiPicker && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.25rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji)
                      setShowEmojiPicker(false)
                    }}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '1.25rem'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            style={{
              flex: 1,
              minHeight: '2.5rem',
              maxHeight: '7.5rem',
              padding: '0.75rem',
              border: '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              resize: 'none',
              outline: 'none'
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || uploading}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: newMessage.trim() && !uploading ? '#3B82F6' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: newMessage.trim() && !uploading ? 'pointer' : 'not-allowed',
              fontSize: '1rem'
            }}
          >
            📤
          </button>
        </div>
      </div>
    </div>
  )
}