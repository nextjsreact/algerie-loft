import { PortableText as BasePortableText } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'
import { Locale } from '@/types/sanity'

interface PortableTextProps {
  content: PortableTextBlock[]
  locale: Locale
  className?: string
}

export default function PortableText({ content, locale, className = '' }: PortableTextProps) {
  if (!content || !Array.isArray(content)) return null
  
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <BasePortableText value={content} />
    </div>
  )
}