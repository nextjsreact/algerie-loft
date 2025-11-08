'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Monitor, Smartphone, Tablet, Eye, EyeOff } from 'lucide-react'

export function ResponsiveDebugger() {
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [documentWidth, setDocumentWidth] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  const [overflowingElements, setOverflowingElements] = useState<Element[]>([])

  useEffect(() => {
    const checkOverflow = () => {
      const vw = window.innerWidth
      const dw = document.documentElement.scrollWidth
      
      setViewportWidth(vw)
      setDocumentWidth(dw)
      setHasHorizontalScroll(dw > vw)

      // Trouver les éléments qui débordent
      const elements = document.querySelectorAll('*')
      const overflowing: Element[] = []
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.right > vw) {
          overflowing.push(el)
        }
      })
      
      setOverflowingElements(overflowing.slice(0, 10)) // Limiter à 10
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    
    return () => window.removeEventListener('resize', checkOverflow)
  }, [])

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    
    if (!debugMode) {
      document.body.classList.add('debug-mode')
      // Ajouter des bordures rouges aux éléments qui débordent
      overflowingElements.forEach(el => {
        el.classList.add('debug-overflow')
      })
    } else {
      document.body.classList.remove('debug-mode')
      // Supprimer les bordures
      document.querySelectorAll('.debug-overflow').forEach(el => {
        el.classList.remove('debug-overflow')
      })
    }
  }

  const fixOverflow = () => {
    // Appliquer des corrections CSS temporaires
    const style = document.createElement('style')
    style.id = 'responsive-fix'
    style.textContent = `
      body { overflow-x: hidden !important; }
      * { max-width: 100vw !important; box-sizing: border-box !important; }
      .grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important; }
      table { width: 100% !important; table-layout: fixed !important; }
    `
    
    // Supprimer l'ancien style s'il existe
    const oldStyle = document.getElementById('responsive-fix')
    if (oldStyle) oldStyle.remove()
    
    document.head.appendChild(style)
    
    // Re-vérifier après correction
    setTimeout(() => {
      const newDw = document.documentElement.scrollWidth
      const vw = window.innerWidth
      setDocumentWidth(newDw)
      setHasHorizontalScroll(newDw > vw)
    }, 100)
  }

  const getDeviceType = () => {
    if (viewportWidth < 768) return { icon: Smartphone, label: 'Mobile', color: 'text-blue-600' }
    if (viewportWidth < 1024) return { icon: Tablet, label: 'Tablette', color: 'text-green-600' }
    return { icon: Monitor, label: 'Desktop', color: 'text-purple-600' }
  }

  const device = getDeviceType()
  const DeviceIcon = device.icon

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DeviceIcon className={`h-5 w-5 ${device.color}`} />
          Débogueur Responsive
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            {hasHorizontalScroll ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span className="font-medium">
              {hasHorizontalScroll ? 'Scroll horizontal détecté' : 'Pas de scroll horizontal'}
            </span>
          </div>
          <Badge variant={hasHorizontalScroll ? 'destructive' : 'default'}>
            {hasHorizontalScroll ? 'Problème' : 'OK'}
          </Badge>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Largeur viewport</div>
            <div className="text-lg font-bold">{viewportWidth}px</div>
            <div className="text-xs text-gray-500">{device.label}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Largeur document</div>
            <div className="text-lg font-bold">{documentWidth}px</div>
            <div className="text-xs text-gray-500">
              {documentWidth > viewportWidth ? `+${documentWidth - viewportWidth}px` : 'OK'}
            </div>
          </div>
        </div>

        {/* Éléments qui débordent */}
        {overflowingElements.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">
              Éléments qui débordent ({overflowingElements.length})
            </h4>
            <div className="space-y-1 text-sm">
              {overflowingElements.slice(0, 5).map((el, index) => (
                <div key={index} className="text-red-700">
                  • {el.tagName.toLowerCase()}{el.className ? `.${el.className.split(' ')[0]}` : ''}
                </div>
              ))}
              {overflowingElements.length > 5 && (
                <div className="text-red-600">... et {overflowingElements.length - 5} autres</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={toggleDebugMode}
            variant={debugMode ? "destructive" : "outline"}
            size="sm"
            className="flex-1"
          >
            {debugMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {debugMode ? 'Désactiver debug' : 'Mode debug'}
          </Button>
          
          {hasHorizontalScroll && (
            <Button
              onClick={fixOverflow}
              variant="default"
              size="sm"
              className="flex-1"
            >
              Correction rapide
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm">
          <h4 className="font-medium text-blue-800 mb-2">Comment utiliser :</h4>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>Activez le mode debug pour voir les éléments problématiques</li>
            <li>Utilisez "Correction rapide" pour un fix temporaire</li>
            <li>Redimensionnez la fenêtre pour tester différentes tailles</li>
            <li>Corrigez le CSS des éléments identifiés</li>
          </ol>
        </div>

        {/* Solutions */}
        {hasHorizontalScroll && (
          <div className="p-3 bg-yellow-50 rounded-lg text-sm">
            <h4 className="font-medium text-yellow-800 mb-2">Solutions recommandées :</h4>
            <ul className="text-yellow-700 space-y-1 list-disc list-inside">
              <li>Ajouter <code>overflow-x: hidden</code> au body</li>
              <li>Utiliser <code>max-width: 100%</code> sur les éléments larges</li>
              <li>Remplacer les grilles fixes par des grilles responsive</li>
              <li>Encapsuler les tableaux dans des conteneurs scrollables</li>
              <li>Utiliser <code>box-sizing: border-box</code> partout</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ResponsiveDebugger