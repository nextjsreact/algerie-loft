'use client'

import { useEffect } from 'react'

export function NuclearSpacingFix() {
  useEffect(() => {
    console.log('🚀 EMERGENCY SPACING FIX ACTIVÉ')
    
    // Fonction ultra-agressive pour forcer l'espacement
    const emergencySpacing = () => {
      // Appliquer des styles directement au body
      document.body.style.wordSpacing = '0.5rem'
      document.body.style.letterSpacing = '0.1rem'
      document.body.style.lineHeight = '2'
      
      const allElements = document.querySelectorAll('*')
      
      allElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          // Forcer l'espacement ULTRA-AGRESSIF
          element.style.wordSpacing = '0.5rem'
          element.style.letterSpacing = '0.1rem'
          element.style.margin = '0.25rem'
          element.style.padding = '0.125rem'
          
          // Forcer display inline-block pour éviter la concaténation
          if (element.tagName === 'SPAN' || element.tagName === 'A' || element.tagName === 'BUTTON') {
            element.style.display = 'inline-block'
            element.style.marginRight = '0.5rem'
          }
          
          // Correction spéciale pour les éléments de navigation
          if (element.closest('nav') || element.closest('.sidebar')) {
            element.style.margin = '0.5rem'
            element.style.padding = '0.25rem'
          }
        }
      })
      
      console.log('✅ EMERGENCY SPACING appliqué à', allElements.length, 'éléments')
    }

    // Appliquer immédiatement et de façon répétée
    emergencySpacing()
    
    const interval = setInterval(emergencySpacing, 1000)
    
    // Observer les changements DOM
    const observer = new MutationObserver(emergencySpacing)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        zIndex: 99999, 
        background: '#ff0000', 
        color: '#ffffff', 
        padding: '10px 15px', 
        fontSize: '14px',
        fontWeight: 'bold',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        pointerEvents: 'none'
      }}
    >
      🚨 EMERGENCY FIX ACTIF 🚨
    </div>
  )
}