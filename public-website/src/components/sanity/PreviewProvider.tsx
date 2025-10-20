'use client'

interface PreviewProviderProps {
  children: React.ReactNode
  token: string
}

export default function PreviewProvider({ children, token }: PreviewProviderProps) {
  if (!token) {
    throw new Error('Preview token is required')
  }

  // Simplified preview provider - can be enhanced later
  return <>{children}</>
}