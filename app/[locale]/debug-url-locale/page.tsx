'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DebugUrlLocale() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [urlInfo, setUrlInfo] = useState<any>({})
  
  useEffect(() => {
    setUrlInfo({
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    })
  }, [])
  
  const forceToFrench = () => {
    const currentPath = window.location.pathname
    const frenchPath = currentPath.replace(/^\/[a-z]{2}\//, '/fr/')
    router.push(frenchPath)
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f0f0f0' }}>
      <h1>🔍 Debug URL et Locale</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid red', backgroundColor: 'white' }}>
        <h2>🚨 PROBLÈME DÉTECTÉ</h2>
        <p><strong>Locale détectée par useLocale():</strong> <span style={{color: 'red', fontSize: '18px'}}>{locale}</span></p>
        <p><strong>Pathname Next.js:</strong> {pathname}</p>
        <p><strong>URL complète:</strong> {urlInfo.href}</p>
        <p><strong>Pathname navigateur:</strong> {urlInfo.pathname}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: 'white' }}>
        <h2>🔧 Actions de correction</h2>
        <button 
          onClick={forceToFrench}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🇫🇷 Forcer URL française
        </button>
        
        <button 
          onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ Vider cache et recharger
        </button>
      </div>
      
      <div style={{ padding: '15px', border: '1px solid #ccc', backgroundColor: 'white' }}>
        <h2>📊 Informations détaillées</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            locale,
            pathname,
            urlInfo,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
            language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
            languages: typeof navigator !== 'undefined' ? navigator.languages : 'N/A'
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}