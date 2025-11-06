'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LocaleDebugPage() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [clientInfo, setClientInfo] = useState<any>({})
  
  useEffect(() => {
    setClientInfo({
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      cookies: document.cookie,
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key)
        return acc
      }, {} as any)
    })
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🌐 Diagnostic de Locale</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid red', borderRadius: '5px' }}>
        <h2>🚨 PROBLÈME DÉTECTÉ</h2>
        <p><strong>Locale détectée:</strong> <span style={{color: 'red', fontSize: '18px'}}>{locale}</span></p>
        <p><strong>Pathname Next.js:</strong> {pathname}</p>
        <p><strong>URL complète:</strong> {clientInfo.url}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🧪 Test des traductions</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div>
            <strong>nav.dashboard:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('dashboard')}"
            </span>
          </div>
          <div>
            <strong>nav.lofts:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('lofts')}"
            </span>
          </div>
          <div>
            <strong>nav.loftManager:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('loftManager')}"
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🌍 Informations navigateur</h2>
        <div style={{ fontSize: '12px' }}>
          <p><strong>Langue navigateur:</strong> {clientInfo.language}</p>
          <p><strong>Langues acceptées:</strong> {JSON.stringify(clientInfo.languages)}</p>
          <p><strong>Cookies:</strong> {clientInfo.cookies || 'Aucun'}</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>💾 LocalStorage</h2>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(clientInfo.localStorage, null, 2)}
        </pre>
      </div>
      
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🔧 Actions de correction</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              // Forcer la locale française
              window.location.href = '/fr' + window.location.pathname.replace(/^\/[a-z]{2}/, '')
            }}
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🇫🇷 Forcer Français
          </button>
          <button 
            onClick={() => {
              // Vider tout le cache
              localStorage.clear()
              sessionStorage.clear()
              document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=")
                const name = eqPos > -1 ? c.substr(0, eqPos) : c
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
              })
              window.location.reload()
            }}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🗑️ Vider tout le cache
          </button>
        </div>
      </div>
    </div>
  )
}