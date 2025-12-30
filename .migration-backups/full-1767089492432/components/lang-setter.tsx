"use client"

import { useEffect } from 'react'

interface LangSetterProps {
  locale: string
}

export function LangSetter({ locale }: LangSetterProps) {
  useEffect(() => {
    // Set the lang attribute on the html element
    document.documentElement.lang = locale
    
    // Pas de RTL - toutes les langues s'affichent de gauche à droite
    document.documentElement.dir = 'ltr'
    
    // Ajouter une classe pour l'espacement arabe
    if (locale === 'ar') {
      document.body.classList.add('arabic-text')
    } else {
      document.body.classList.remove('arabic-text')
    }
    
    // Pas de classes RTL
    document.body.classList.add('ltr')
    document.body.classList.remove('rtl')
  }, [locale])

  return null
}