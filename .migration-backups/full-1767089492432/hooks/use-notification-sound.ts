import { useCallback } from 'react'
import { playNotificationBeep } from '@/utils/notification-sound'

export function useNotificationSound() {
  // Créer un son de notification synthétique avec Web Audio API
  const createNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Créer un oscillateur pour générer le son
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      // Connecter les nœuds
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Configuration du son (fréquence et volume)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // Note élevée
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1) // Note plus basse
      
      // Enveloppe du volume (fade in/out)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)
      
      // Jouer le son
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      
      return true
    } catch (error) {
      console.error('Error creating synthetic notification sound:', error)
      return false
    }
  }, [])

  // Fallback avec un fichier audio si disponible
  const playAudioFile = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      
      return audio.play().then(() => {
        console.log('Audio file notification played successfully')
        return true
      }).catch(error => {
        console.log('Audio file failed, trying synthetic sound:', error)
        return false
      })
    } catch (error) {
      console.log('Audio file creation failed:', error)
      return Promise.resolve(false)
    }
  }, [])

  const playNotificationSound = useCallback(async () => {
    console.log('Attempting to play notification sound')
    
    try {
      // Essayer d'abord le fichier audio
      const audioSuccess = await playAudioFile()
      
      if (!audioSuccess) {
        // Essayer le beep en base64
        try {
          await playNotificationBeep()
          console.log('Base64 notification sound played successfully')
        } catch (beepError) {
          // Si tout échoue, utiliser le son synthétique
          console.log('Falling back to synthetic notification sound')
          createNotificationSound()
        }
      }
    } catch (error) {
      console.log('All notification methods failed, trying final fallback')
      try {
        await playNotificationBeep()
      } catch (finalError) {
        createNotificationSound()
      }
    }
  }, [playAudioFile, createNotificationSound])

  const setVolume = useCallback((volume: number) => {
    // Cette fonction est maintenant principalement pour la compatibilité
    console.log(`Volume set to: ${volume}`)
  }, [])

  return {
    playNotificationSound,
    setVolume,
    isInitialized: true // Toujours initialisé car on utilise Web Audio API
  }
}