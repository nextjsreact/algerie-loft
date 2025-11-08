'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, Smartphone, Monitor, Check, X } from 'lucide-react'

export function MobileBurgerTest() {
  const [tests, setTests] = useState([
    { name: 'Menu burger visible', status: 'pending' },
    { name: 'Menu burger cliquable', status: 'pending' },
    { name: 'Sidebar s\'ouvre', status: 'pending' },
    { name: 'Navigation fonctionne', status: 'pending' }
  ])

  const runTest = (index: number, status: 'passed' | 'failed') => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status } : test
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Test Menu Burger Mobile
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm">
          <h4 className="font-medium text-blue-800 mb-2">Instructions :</h4>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>Ouvrez les outils développeur (F12)</li>
            <li>Activez le mode mobile (Ctrl+Shift+M)</li>
            <li>Cherchez le menu burger (☰) en haut à droite</li>
            <li>Cliquez dessus pour ouvrir la sidebar</li>
          </ol>
        </div>

        {/* Tests */}
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                {getStatusIcon(test.status)}
                <span className="text-sm">{test.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTest(index, 'passed')}
                  className="h-6 px-2 text-xs"
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTest(index, 'failed')}
                  className="h-6 px-2 text-xs"
                >
                  ✗
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Résumé */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Résultat :</span>
            <Badge className={getStatusColor(
              tests.every(t => t.status === 'passed') ? 'passed' :
              tests.some(t => t.status === 'failed') ? 'failed' : 'pending'
            )}>
              {tests.filter(t => t.status === 'passed').length}/{tests.length} réussis
            </Badge>
          </div>
        </div>

        {/* Aide */}
        <div className="p-3 bg-yellow-50 rounded-lg text-sm">
          <h4 className="font-medium text-yellow-800 mb-2">Si le menu burger n'apparaît pas :</h4>
          <ul className="text-yellow-700 space-y-1 list-disc list-inside">
            <li>Vérifiez que vous êtes en mode mobile (F12 → mode responsive)</li>
            <li>Rafraîchissez la page (Ctrl+F5)</li>
            <li>Vérifiez la console pour les erreurs</li>
            <li>Assurez-vous d'être connecté</li>
          </ul>
        </div>

        {/* Simulation visuelle */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">À quoi ça devrait ressembler :</h4>
          <div className="bg-gray-900 text-white p-2 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white/20 rounded"></div>
              <span>Logo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-white/20 rounded text-xs flex items-center justify-center">FR</div>
              <div className="w-4 h-4 bg-white/20 rounded-full"></div>
              <div className="w-6 h-6 bg-white/20 rounded border border-white/40 flex items-center justify-center">
                <Menu className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MobileBurgerTest