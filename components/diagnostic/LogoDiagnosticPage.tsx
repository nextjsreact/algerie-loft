'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedLogo, { HeaderLogo, HeroLogo, FooterLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';
import { logoAssetManager, DEFAULT_LOGO_CONFIG } from '@/lib/logo-asset-manager';

interface DiagnosticResult {
  src: string;
  exists: boolean;
  loadTime?: number;
  error?: string;
  size?: { width: number; height: number };
}

interface NetworkSimulation {
  type: 'fast' | 'slow' | 'offline';
  delay: number;
  label: string;
}

const NETWORK_SIMULATIONS: NetworkSimulation[] = [
  { type: 'fast', delay: 0, label: '🚀 Connexion rapide' },
  { type: 'slow', delay: 2000, label: '🐌 Connexion lente (2s)' },
  { type: 'offline', delay: 5000, label: '📵 Hors ligne (timeout)' }
];

export default function LogoDiagnosticPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkSimulation>(NETWORK_SIMULATIONS[0]);
  const [testSrc, setTestSrc] = useState('/logo.jpg');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Test sources to diagnose
  const testSources = [
    '/logo.jpg',
    '/logo.png', 
    '/logo-temp.svg',
    '/logo-fallback.svg',
    '/placeholder-logo.svg',
    '/nonexistent-logo.jpg' // Intentionally broken for testing
  ];

  // Run comprehensive logo diagnostic
  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setDiagnosticResults([]);

    console.log('🔍 Starting logo diagnostic...');

    const results: DiagnosticResult[] = [];

    for (const src of testSources) {
      try {
        const startTime = performance.now();
        
        // Simulate network conditions
        if (selectedNetwork.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, selectedNetwork.delay));
        }

        const exists = await logoAssetManager.verifyAssetExists(src);
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        results.push({
          src,
          exists,
          loadTime,
          error: exists ? undefined : 'Asset not found'
        });

        console.log(`${exists ? '✅' : '❌'} ${src} - ${loadTime.toFixed(2)}ms`);
      } catch (error) {
        results.push({
          src,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`🚨 Error testing ${src}:`, error);
      }

      // Update results progressively
      setDiagnosticResults([...results]);
    }

    setIsRunningDiagnostic(false);
    console.log('✅ Logo diagnostic completed');
  };

  // Clear asset cache for testing
  const clearCache = () => {
    logoAssetManager.clearCache();
    setDiagnosticResults([]);
    console.log('🧹 Logo cache cleared');
  };

  // Preload critical logos
  const preloadLogos = async () => {
    try {
      await logoAssetManager.preloadCriticalLogos();
      console.log('🚀 Critical logos preloaded');
    } catch (error) {
      console.error('Failed to preload logos:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🔧 Diagnostic Logo - Loft Algérie
          </h1>
          <p className="text-gray-300">
            Outils de diagnostic et de test pour les logos
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Network Simulation */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Simulation Réseau
              </label>
              <select
                value={selectedNetwork.type}
                onChange={(e) => {
                  const network = NETWORK_SIMULATIONS.find(n => n.type === e.target.value);
                  if (network) setSelectedNetwork(network);
                }}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
              >
                {NETWORK_SIMULATIONS.map(network => (
                  <option key={network.type} value={network.type}>
                    {network.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Source */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Source de Test
              </label>
              <input
                type="text"
                value={testSrc}
                onChange={(e) => setTestSrc(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
                placeholder="/logo.jpg"
              />
            </div>

            {/* Actions */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Actions
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={runDiagnostic}
                  disabled={isRunningDiagnostic}
                  className="flex-1 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isRunningDiagnostic ? '🔍 Test...' : '🔍 Tester'}
                </button>
                <button
                  onClick={clearCache}
                  className="p-3 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                >
                  🧹
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="mt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-300 hover:text-blue-200 text-sm"
            >
              {showAdvanced ? '▼' : '▶'} Options avancées
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="flex space-x-4">
                  <button
                    onClick={preloadLogos}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    🚀 Précharger logos critiques
                  </button>
                  <button
                    onClick={() => console.log('Logo config:', DEFAULT_LOGO_CONFIG)}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    📋 Afficher config
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Diagnostic Results */}
        {diagnosticResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8"
          >
            <h3 className="text-white font-bold mb-4">📊 Résultats du Diagnostic</h3>
            
            <div className="space-y-3">
              {diagnosticResults.map((result, index) => (
                <div
                  key={result.src}
                  className={`p-4 rounded-lg border ${
                    result.exists 
                      ? 'bg-green-500/20 border-green-400/30' 
                      : 'bg-red-500/20 border-red-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {result.exists ? '✅' : '❌'}
                      </span>
                      <div>
                        <div className="text-white font-medium">{result.src}</div>
                        {result.error && (
                          <div className="text-red-300 text-sm">{result.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.loadTime && (
                        <div className="text-gray-300 text-sm">
                          {result.loadTime.toFixed(2)}ms
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Live Logo Tests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8"
        >
          <h3 className="text-white font-bold mb-6 text-center">
            🎯 Test en Direct des Composants Logo
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Compact Logo Test */}
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Compact Logo</h4>
              <div className="bg-white/5 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[80px]">
                <CompactLogo 
                  src={testSrc} 
                  onLoadError={(error) => console.error('Compact logo error:', error)}
                />
              </div>
              <p className="text-gray-300 text-sm">80x24px - Mobile/Sidebar</p>
            </div>

            {/* Header Logo Test */}
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Header Logo</h4>
              <div className="bg-white/5 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[80px]">
                <HeaderLogo 
                  src={testSrc} 
                  onLoadError={(error) => console.error('Header logo error:', error)}
                />
              </div>
              <p className="text-gray-300 text-sm">120x36px - Navigation</p>
            </div>

            {/* Footer Logo Test */}
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Footer Logo</h4>
              <div className="bg-white/5 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[80px]">
                <FooterLogo 
                  src={testSrc}
                  onLoadError={(error) => console.error('Footer logo error:', error)}
                />
              </div>
              <p className="text-gray-300 text-sm">160x48px - Pied de page</p>
            </div>

            {/* Hero Logo Test */}
            <div className="text-center xl:col-span-4">
              <h4 className="text-white font-semibold mb-4">Hero Logo</h4>
              <div className="bg-white/5 rounded-lg p-6 mb-4 flex items-center justify-center">
                <HeroLogo 
                  src={testSrc}
                  onLoadError={(error) => console.error('Hero logo error:', error)}
                />
              </div>
              <p className="text-gray-300 text-sm">350x140px - Page d'accueil</p>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6"
        >
          <h3 className="text-blue-200 font-bold mb-4">📋 Guide d'Utilisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Diagnostic automatique :</h4>
              <ul className="space-y-1 text-blue-200">
                <li>• Cliquez sur "🔍 Tester" pour analyser tous les logos</li>
                <li>• Simulez différentes conditions réseau</li>
                <li>• Vérifiez les temps de chargement</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Test personnalisé :</h4>
              <ul className="space-y-1 text-blue-200">
                <li>• Modifiez la "Source de Test"</li>
                <li>• Observez le comportement en temps réel</li>
                <li>• Consultez la console pour les détails</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}