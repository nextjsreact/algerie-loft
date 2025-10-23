'use client';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { OptimizedLogo } from '@/components/ui/OptimizedLogo';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useDebounce, useIntersectionObserver } from '@/hooks/usePerformanceOptimization';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Données de test pour la liste virtualisée
const generateTestData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    description: `Description pour l'item ${i + 1}`,
    value: Math.floor(Math.random() * 1000)
  }));
};

const testData = generateTestData(10000); // 10k items pour tester la virtualisation

export default function PerformanceTestPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLargeList, setShowLargeList] = useState(false);
  const testRef = useRef<HTMLDivElement>(null);
  
  // Test du debounce
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Test de l'intersection observer
  const { isIntersecting, hasIntersected } = useIntersectionObserver(testRef);
  
  // Test des requêtes optimisées (simulation)
  const { data: testData1, loading: loading1 } = useOptimizedQuery(
    'test-data-1',
    async () => {
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: 'Données chargées avec succès !', timestamp: Date.now() };
    },
    { staleTime: 30000 } // 30 secondes
  );

  const filteredData = testData.filter(item => 
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test des Optimisations de Performance</h1>
        <p className="text-gray-600 mb-8">
          Cette page teste tous les composants et hooks d'optimisation implémentés.
        </p>
      </div>

      {/* Test du Logo Optimisé */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Logo Optimisé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <OptimizedLogo variant="header" priority />
            <OptimizedLogo variant="sidebar" />
            <OptimizedLogo variant="footer" />
          </div>
          <p className="text-sm text-gray-600">
            Logos avec lazy loading, intersection observer et fallbacks élégants.
          </p>
        </CardContent>
      </Card>

      {/* Test des Images Optimisées */}
      <Card>
        <CardHeader>
          <CardTitle>🖼️ Images Optimisées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OptimizedImage
              src="/logo.png"
              alt="Test image 1"
              width={200}
              height={150}
              priority={true}
              className="rounded-lg"
            />
            <OptimizedImage
              src="/nonexistent.jpg"
              alt="Test image 2 (erreur)"
              width={200}
              height={150}
              className="rounded-lg"
            />
            <OptimizedImage
              src="/logo.png"
              alt="Test image 3"
              width={200}
              height={150}
              loading="lazy"
              className="rounded-lg"
            />
          </div>
          <p className="text-sm text-gray-600">
            Images avec formats modernes, lazy loading et gestion d'erreurs.
          </p>
        </CardContent>
      </Card>

      {/* Test du Debounce */}
      <Card>
        <CardHeader>
          <CardTitle>⏱️ Recherche avec Debounce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tapez pour rechercher (debounce 300ms)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-sm space-y-1">
            <p><strong>Terme de recherche:</strong> {searchTerm}</p>
            <p><strong>Terme debounced:</strong> {debouncedSearch}</p>
            <p><strong>Résultats trouvés:</strong> {filteredData.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Test des Requêtes Optimisées */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Requêtes Optimisées avec Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading1 ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Chargement des données...</span>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg">
              <p><strong>Message:</strong> {testData1?.message}</p>
              <p><strong>Timestamp:</strong> {new Date(testData1?.timestamp || 0).toLocaleTimeString()}</p>
            </div>
          )}
          <p className="text-sm text-gray-600">
            Données mises en cache pendant 30 secondes. Rechargez la page pour voir le cache en action.
          </p>
        </CardContent>
      </Card>

      {/* Test de l'Intersection Observer */}
      <Card>
        <CardHeader>
          <CardTitle>👁️ Intersection Observer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 overflow-y-auto border rounded p-4">
            <div className="h-96 bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
              <p>Scrollez vers le bas...</p>
            </div>
            <div 
              ref={testRef}
              className={`p-4 rounded transition-colors duration-300 ${
                isIntersecting ? 'bg-green-200' : 'bg-gray-200'
              }`}
            >
              <p><strong>Visible:</strong> {isIntersecting ? 'Oui' : 'Non'}</p>
              <p><strong>A été visible:</strong> {hasIntersected ? 'Oui' : 'Non'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test de la Liste Virtualisée */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Liste Virtualisée (10,000 items)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setShowLargeList(!showLargeList)}
            variant={showLargeList ? "destructive" : "default"}
          >
            {showLargeList ? 'Masquer' : 'Afficher'} la liste virtualisée
          </Button>
          
          {showLargeList && (
            <VirtualizedList
              items={filteredData}
              itemHeight={60}
              containerHeight={400}
              renderItem={(item, index) => (
                <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{item.value}</p>
                    <p className="text-xs text-gray-500">Index: {index}</p>
                  </div>
                </div>
              )}
              className="border rounded-lg"
            />
          )}
          
          <p className="text-sm text-gray-600">
            Seuls les éléments visibles sont rendus pour optimiser les performances.
          </p>
        </CardContent>
      </Card>

      {/* Informations sur les Performances */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Monitoring des Performances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">
              Le monitoring des performances est actif en mode développement. 
              Regardez en bas à droite pour voir le panneau de monitoring en temps réel.
            </p>
            <p className="text-sm mt-2">
              <strong>Fonctionnalités testées:</strong>
            </p>
            <ul className="text-sm mt-1 space-y-1 list-disc list-inside">
              <li>Images optimisées avec lazy loading</li>
              <li>Logos avec intersection observer</li>
              <li>Debounce pour les inputs</li>
              <li>Cache intelligent pour les requêtes</li>
              <li>Liste virtualisée pour 10k+ éléments</li>
              <li>Monitoring des performances en temps réel</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}