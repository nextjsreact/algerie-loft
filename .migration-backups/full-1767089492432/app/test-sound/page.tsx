'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function TestSoundPage() {
  const [audioInitialized, setAudioInitialized] = useState(false)
  
  // Initialize audio on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      setAudioInitialized(true)
      document.removeEventListener('click', handleInteraction)
    }
    
    document.addEventListener('click', handleInteraction)
    return () => document.removeEventListener('click', handleInteraction)
  }, [])
  
  const handlePlaySound = (type: 'success' | 'info' | 'warning' | 'error') => {
    console.log(`Playing ${type} sound...`)
    // Sound functionality would go here
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Sound</h1>
      
      {!audioInitialized && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Click anywhere to enable audio</p>
          <p>Browser blocks audio until user interaction</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Sound Types</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handlePlaySound('success')}
              className="bg-green-500 hover:bg-green-600"
            >
              Success Sound
            </Button>
            <Button
              onClick={() => handlePlaySound('info')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Info Sound
            </Button>
            <Button
              onClick={() => handlePlaySound('warning')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Warning Sound
            </Button>
            <Button
              onClick={() => handlePlaySound('error')}
              className="bg-red-500 hover:bg-red-600"
            >
              Error Sound
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}