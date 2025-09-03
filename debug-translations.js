// Script de débogage pour tester les traductions
console.log('Test des traductions...')

// Simuler le chargement des traductions
const fs = require('fs')
const path = require('path')

try {
  const arTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/locales/ar/availability.json'), 'utf8'))
  console.log('Traductions arabes chargées:', Object.keys(arTranslations).length, 'clés')
  console.log('Clé "unknown":', arTranslations.unknown)
  
  const frTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/locales/fr/availability.json'), 'utf8'))
  console.log('Traductions françaises chargées:', Object.keys(frTranslations).length, 'clés')
  console.log('Clé "unknown":', frTranslations.unknown)
  
} catch (error) {
  console.error('Erreur lors du chargement des traductions:', error.message)
}