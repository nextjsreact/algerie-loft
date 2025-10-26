'use client'

import { useState, useCallback } from 'react'
import { BookingMessage } from '@/lib/types'

interface SendMessageData {
  message: string
  message_type?: 'text' | 'attachment'
  attachment_url?: string
  attachment_name?: string
  attachment_size?: number
}

interface UploadFileResult {
  url: string
  name: string
  size: number
}

interface UseBookingMessagesReturn {
  messages: BookingMessage[]
  loading: boolean
  error: string | null
  sendMessage: (data: SendMessageData) => Promise<void>
  fetchMessages: () => Promise<void>
  uploadFile: (file: File) => Promise<UploadFileResult>
}

export function useBookingMessages(bookingId: string): UseBookingMessagesReturn {
  const [messages, setMessages] = useState<BookingMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching booking messages:', err)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  const sendMessage = useCallback(async (data: SendMessageData) => {
    if (!bookingId) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      
      // Add the new message to the local state
      setMessages(prev => [...prev, result.message])

    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }, [bookingId])

  const uploadFile = useCallback(async (file: File): Promise<UploadFileResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', `bookings/${bookingId}/attachments`)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()
      
      return {
        url: data.url,
        name: file.name,
        size: file.size
      }

    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    }
  }, [bookingId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    fetchMessages,
    uploadFile
  }
}