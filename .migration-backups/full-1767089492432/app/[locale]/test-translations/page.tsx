'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

export default function TranslationTest() {
  const t = useTranslations('lofts')
  const [testResults, setTestResults] = useState<string[]>([])
  
  useEffect(() => {
    const results = []
    
    // Test des clés problématiques
    const testKeys = ['editLoft', 'updatePropertyDetails', 'addLoft']
    
    testKeys.forEach(key => {
      try {
        const value = t(key)
        results.push(`✅ ${key}: "${value}"`)
      } catch (error) {
        results.push(`❌ ${key}: ERROR - ${error.message}`)
      }
    })
    
    setTestResults(results)
  }, [t])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Test des Traductions</h1>
      <div>
        <h2>Namespace: lofts</h2>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            color: result.startsWith('✅') ? 'green' : 'red',
            margin: '5px 0'
          }}>
            {result}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Test direct:</h2>
        <p>editLoft: {t('editLoft')}</p>
        <p>updatePropertyDetails: {t('updatePropertyDetails')}</p>
      </div>
    </div>
  )
}