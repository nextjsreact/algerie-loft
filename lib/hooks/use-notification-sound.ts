'use client'

import { useCallback, useRef } from 'react'

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playNotificationSound = useCallback(async (type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    try {
      // Try to play custom sound first
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notification.mp3')
        audioRef.current.volume = 0.5 // Set volume to 50%
      }

      // Try to play the custom sound
      try {
        await audioRef.current.play()
        return
      } catch (customSoundError) {
        console.log('Custom notification sound not available, using system sound')
      }

      // Fallback to system sounds or Web Audio API
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Different frequencies for different notification types
        const frequencies = {
          success: 800,   // Higher pitch for success
          info: 600,      // Medium pitch for info
          warning: 400,   // Lower pitch for warning
          error: 300      // Lowest pitch for error
        }

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
        oscillator.type = 'sine'

        // Create a pleasant notification sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)

      } catch (webAudioError) {
        console.log('Web Audio API not available, notification will be silent')
      }
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }, [])

  return { playNotificationSound }
}