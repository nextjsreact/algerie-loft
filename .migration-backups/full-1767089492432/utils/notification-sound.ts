// Son de notification simple en base64 (beep court)
export const NOTIFICATION_SOUND_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'

export function playNotificationBeep() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_BASE64)
    audio.volume = 0.3
    return audio.play()
  } catch (error) {
    console.error('Error playing notification beep:', error)
    return Promise.reject(error)
  }
}