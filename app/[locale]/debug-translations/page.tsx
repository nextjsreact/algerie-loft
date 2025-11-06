'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'

export default function DebugTranslationsPage() {
  const locale = useLocale()
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')
  const [testResults, setTestResults] = useState<any[]>([])
  const [rawMessages, setRawMessages] = useState<any>(null)

  useEffect(() => {
    const results = []
    
    // Test des clés problématiques
    const testKeys = [
      'editLoft',
      'updatePropertyDetails', 
      'addLoft',
      'loftInfoTitle',
      'pricePerNight'
    ]
    
    testKeys.forEach(key => {
      try {
        const value = t(key)
        results.push({
          key,
          value,
          status: value === key ? 'FALLBACK' : 'SUCCESS',
          type: typeof value
        })
      } catch (error) {
        results.push({
          key,
          value: null,
          status: 'ERROR',
          error: error.message,
          type: 'error'
        })
      }
    })
    
    // Test des clés communes
    const commonKeys = ['loading', 'save', 'cancel']
    commonKeys.forEach(key => {
      try {
        const value = tCommon(key)
        results.push({
          key: `common.${key}`,
          value,
          status: value === key ? 'FALLBACK' : 'SUCCESS',
          type: typeof value
        })
      } catch (error) {
        results.push({
          key: `common.${key}`,
          value: null,
          status: 'ERROR',
          error: error.message,
          type: 'error'
        })
      }
    })
    
    setTestResults(results)
    
    // Essayer de charger les messages bruts
    fetch(`/messages/${locale}.json`)
      .then(res => res.json())
      .then(data => setRawMessages(data))
      .catch(err => console.error('Erreur chargement messages:', err))
      
  }, [t, tCommon, locale])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>🔍 Diagnostic des Traductions</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>📋 Informations générales</h2>
        <p><strong>Locale actuelle:</strong> {locale}</p>
        <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🧪 Test des traductions</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{ 
                padding: '10px',
                backgroundColor: result.status === 'SUCCESS' ? '#d4edda' : 
                                result.status === 'FALLBACK' ? '#fff3cd' : '#f8d7da',
                border: '1px solid',
                borderColor: result.status === 'SUCCESS' ? '#c3e6cb' : 
                            result.status === 'FALLBACK' ? '#ffeaa7' : '#f5c6cb',
                borderRadius: '3px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{result.key}:</strong></span>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  backgroundColor: result.status === 'SUCCESS' ? '#28a745' : 
                                  result.status === 'FALLBACK' ? '#ffc107' : '#dc3545',
                  color: 'white'
                }}>
                  {result.status}
                </span>
              </div>
              <div style={{ marginTop: '5px' }}>
                <code>"{result.value}"</code>
              </div>
              {result.error && (
                <div style={{ marginTop: '5px', color: '#dc3545', fontSize: '12px' }}>
                  Erreur: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>📄 Messages bruts (extrait)</h2>
        {rawMessages ? (
          <div>
            <p><strong>Namespaces disponibles:</strong> {Object.keys(rawMessages).length}</p>
            <p><strong>Clés dans 'lofts':</strong> {rawMessages.lofts ? Object.keys(rawMessages.lofts).length : 'N/A'}</p>
            
            {rawMessages.lofts && (
              <div style={{ marginTop: '10px' }}>
                <h3>Clés lofts (premières 10):</h3>
                <ul>
                  {Object.keys(rawMessages.lofts).slice(0, 10).map(key => (
                    <li key={key}>
                      <strong>{key}:</strong> "{rawMessages.lofts[key]}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ marginTop: '15px' }}>
              <h3>Vérification des clés problématiques:</h3>
              <ul>
                <li><strong>editLoft:</strong> {rawMessages.lofts?.editLoft ? `"${rawMessages.lofts.editLoft}"` : '❌ MANQUANT'}</li>
                <li><strong>updatePropertyDetails:</strong> {rawMessages.lofts?.updatePropertyDetails ? `"${rawMessages.lofts.updatePropertyDetails}"` : '❌ MANQUANT'}</li>
              </ul>
            </div>
          </div>
        ) : (
          <p>⏳ Chargement des messages bruts...</p>
        )}
      </div>

      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🔧 Actions de test</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🔄 Recharger la page
          </button>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }
            }}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🗑️ Vider le cache et recharger
          </button>
          <button 
            onClick={() => {
              console.log('Test results:', testResults)
              console.log('Raw messages:', rawMessages)
            }}
            style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            📊 Log dans la console
          </button>
        </div>
      </div>
    </div>
  )
}