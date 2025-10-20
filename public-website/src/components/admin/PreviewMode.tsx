'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'

interface PreviewModeProps {
  isEnabled?: boolean
  onToggle?: (enabled: boolean) => void
  previewUrl?: string
}

export default function PreviewMode({ 
  isEnabled = false, 
  onToggle,
  previewUrl 
}: PreviewModeProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(isEnabled)

  useEffect(() => {
    setIsPreviewMode(isEnabled)
  }, [isEnabled])

  const handleToggle = () => {
    const newState = !isPreviewMode
    setIsPreviewMode(newState)
    onToggle?.(newState)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Preview Mode</span>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPreviewMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPreviewMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isPreviewMode && (
          <div className="space-y-2">
            <div className="flex items-center text-xs text-green-600">
              <Eye className="h-3 w-3 mr-1" />
              Preview mode active
            </div>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open preview
              </a>
            )}
          </div>
        )}

        {!isPreviewMode && (
          <div className="flex items-center text-xs text-gray-500">
            <EyeOff className="h-3 w-3 mr-1" />
            Preview mode disabled
          </div>
        )}
      </div>
    </div>
  )
}