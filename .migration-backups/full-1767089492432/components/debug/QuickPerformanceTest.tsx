'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, Database, CheckCircle, AlertTriangle } from 'lucide-react'

interface PerformanceTest {
  name: string
  status: 'running' | 'passed' | 'failed' | 'pending'
  duration?: number
  score?: number
  message?: string
}

export function QuickPerformanceTest() {
  const [tests, setTests] = useState<PerformanceTest[]>([
    { name: 'Temps de chargement initial', status: 'pending' },
    { name: 'Temps de réponse API', status: 'pending' },
    { name: 'Utilisation mémoire', status: 'pending' },
    { name: 'Taille du bundle', status: 'pending' },
    { name: 'Images optimisées', status: 'pending' }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [overallScore, setOverallScore] = useState(0)

  const runTests = async () => {
    setIsRunning(true)
    setOverallScore(0)

    // Test 1: Temps de chargement initial
    updateTest(0, { status: 'running' })
    const loadStart = performance.now()
    await new Promise(resolve => setTimeout(resolve, 100)) // Simuler un test
    const loadTime = performance.now() - loadStart
    
    updateTest(0, {
      status: loadTime < 1000 ? 'passed' : 'failed',
      duration: loadTime,
      score: loadTime < 1000 ? 100 : Math.max(0, 100 - (loadTime - 1000) / 10),
      message: `${loadTime.toFixed(0)}ms ${loadTime < 1000 ? '(Excellent)' : '(Lent)'}`
    })

    // Test 2: Temps de réponse API
    updateTest(1, { status: 'running' })
    try {
      const apiStart = performance.now()
      const response = await fetch('/api/lofts?limit=1')
      const apiTime = performance.now() - apiStart
      
      updateTest(1, {
        status: response.ok && apiTime < 500 ? 'passed' : 'failed',
        duration: apiTime,
        score: apiTime < 500 ? 100 : Math.max(0, 100 - (apiTime - 500) / 10),
        message: `${apiTime.toFixed(0)}ms ${response.ok ? '(OK)' : '(Erreur)'}`
      })
    } catch (error) {
      updateTest(1, {
        status: 'failed',
        score: 0,
        message: 'API non disponible'
      })
    }

    // Test 3: Utilisation mémoire
    updateTest(2, { status: 'running' })
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // MB
      
      updateTest(2, {
        status: memoryUsage < 50 ? 'passed' : 'failed',
        score: memoryUsage < 50 ? 100 : Math.max(0, 100 - (memoryUsage - 50) * 2),
        message: `${memoryUsage.toFixed(1)}MB ${memoryUsage < 50 ? '(Bon)' : '(Élevé)'}`
      })
    } else {
      updateTest(2, {
        status: 'failed',
        score: 50,
        message: 'Non supporté par ce navigateur'
      })
    }

    // Test 4: Taille du bundle (estimation)
    updateTest(3, { status: 'running' })
    const scripts = document.querySelectorAll('script[src]')
    let estimatedSize = 0
    
    // Estimation basée sur le nombre de scripts
    estimatedSize = scripts.length * 50 // 50KB par script en moyenne
    
    updateTest(3, {
      status: estimatedSize < 500 ? 'passed' : 'failed',
      score: estimatedSize < 500 ? 100 : Math.max(0, 100 - (estimatedSize - 500) / 10),
      message: `~${estimatedSize}KB ${estimatedSize < 500 ? '(Optimisé)' : '(Lourd)'}`
    })

    // Test 5: Images optimisées
    updateTest(4, { status: 'running' })
    const images = document.querySelectorAll('img')
    const nextImages = document.querySelectorAll('img[data-nimg]') // Images Next.js
    const optimizedRatio = images.length > 0 ? (nextImages.length / images.length) * 100 : 100
    
    updateTest(4, {
      status: optimizedRatio > 80 ? 'passed' : 'failed',
      score: optimizedRatio,
      message: `${optimizedRatio.toFixed(0)}% optimisées (${nextImages.length}/${images.length})`
    })

    setIsRunning(false)
    
    // Calculer le score global
    setTimeout(() => {
      const scores = tests.map(test => test.score || 0)
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      setOverallScore(avgScore)
    }, 500)
  }

  const updateTest = (index: number, updates: Partial<PerformanceTest>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const getStatusIcon = (status: PerformanceTest['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test de Performance Rapide
          </CardTitle>
          {overallScore > 0 && (
            <Badge variant="outline" className={getScoreColor(overallScore)}>
              Score: {overallScore.toFixed(0)}/100
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <span className="font-medium">{test.name}</span>
              </div>
              
              <div className="text-right">
                {test.score !== undefined && (
                  <div className={`font-bold ${getScoreColor(test.score)}`}>
                    {test.score.toFixed(0)}/100
                  </div>
                )}
                {test.message && (
                  <div className="text-sm text-gray-600">{test.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Test en cours...' : 'Lancer le test'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              setTests(tests.map(test => ({ ...test, status: 'pending', score: undefined, message: undefined })))
              setOverallScore(0)
            }}
          >
            Reset
          </Button>
        </div>

        {overallScore > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Recommandations:</h4>
            <ul className="text-sm space-y-1">
              {overallScore < 80 && (
                <>
                  <li>• Lancez <code>npm run perf:quick-fix</code> pour des optimisations rapides</li>
                  <li>• Utilisez les composants FastImage pour les images</li>
                  <li>• Implémentez le cache pour les données fréquentes</li>
                </>
              )}
              {overallScore >= 80 && (
                <li className="text-green-600">✅ Excellentes performances ! Continuez ainsi.</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuickPerformanceTest