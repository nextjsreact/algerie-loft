'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeaderLogo, HeroLogo, FooterLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';
import { logoAssetManager, DEFAULT_LOGO_CONFIG } from '@/lib/logo-asset-manager';
import { logoHealthMonitor, logHealthReport } from '@/lib/logo-health-monitor';

interface DiagnosticResult {
  src: string;
  exists: boolean;
  loadTime?: number;
  error?: string;
}

export default function LogoDiagnosticsPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [networkSimulation, setNetworkSimulation] = useState<'normal' | 'slow' | 'offline'>('normal');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [healthReport, setHealthReport] = useState<string>('');

  // Initialize with default logo sources
  useEffect(() => {
    const allSources = [
      DEFAULT_LOGO_CONFIG.primary,
      ...DEFAULT_LOGO_CONFIG.fallbacks,
      DEFAULT_LOGO_CONFIG.placeholder
    ];
    setSelectedSources(allSources);
  }, []);

  // Run comprehensive logo diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults([]);

    const results: DiagnosticResult[] = [];

    for (const src of selectedSources) {
      const startTime = performance.now();
      
      try {
        // Simulate network conditions
        if (networkSimulation === 'slow') {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (networkSimulation === 'offline') {
          throw new Error('Simulated offline condition');
        }

        const exists = await logoAssetManager.verifyAssetExists(src);
        const loadTime = performance.now() - startTime;

        results.push({
          src,
          exists,
          loadTime
        });

      } catch (error) {
        const loadTime = performance.now() - startTime;
        results.push({
          src,
          exists: false,
          loadTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update results progressively
      setDiagnosticResults([...results]);
    }

    setIsRunningDiagnostics(false);
  };

  // Generate health report
  const generateHealthReport = () => {
    const report = logoHealthMonitor.generateHealthReport();
    setHealthReport(report);
    logHealthReport();
  };

  // Clear logo cache
  const clearCache = () => {
    logoAssetManager.clearCache();
    logoHealthMonitor.reset();
    setHealthReport('');
    alert('Logo cache and health monitor cleared!');
  };

  // Test specific logo source
  const testLogoSource = (src: string) => {
    const newSources = selectedSources.includes(src) 
      ? selectedSources.filter(s => s !== src)
      : [...selectedSources, src];
    setSelectedSources(newSources);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
            🔧 Logo Diagnostics & Testing
          </h1>

          {/* Logo Variants Preview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Logo Variants Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-medium text-gray-600 mb-4">Header Logo</h3>
                <div className="flex justify-center">
                  <HeaderLogo />
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-medium text-gray-600 mb-4">Hero Logo</h3>
                <div className="flex justify-center">
                  <HeroLogo showGlow={false} />
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-medium text-gray-600 mb-4">Footer Logo</h3>
                <div className="flex justify-center">
                  <FooterLogo />
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-medium text-gray-600 mb-4">Compact Logo</h3>
                <div className="flex justify-center">
                  <CompactLogo />
                </div>
              </div>
            </div>
          </section>

          {/* Diagnostic Controls */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Diagnostic Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Network Simulation */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">Network Simulation</h3>
                <select
                  value={networkSimulation}
                  onChange={(e) => setNetworkSimulation(e.target.value as any)}
                  className="w-full p-2 border border-blue-200 rounded-md"
                >
                  <option value="normal">Normal Connection</option>
                  <option value="slow">Slow Connection (2s delay)</option>
                  <option value="offline">Offline Mode</option>
                </select>
              </div>

              {/* Actions */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={runDiagnostics}
                    disabled={isRunningDiagnostics}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
                  </button>
                  <button
                    onClick={generateHealthReport}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Generate Health Report
                  </button>
                </div>
              </div>

              {/* Cache Management */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 mb-3">Cache Management</h3>
                <button
                  onClick={clearCache}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Clear Cache & Reset
                </button>
              </div>
            </div>

            {/* Logo Sources Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-3">Logo Sources to Test</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  DEFAULT_LOGO_CONFIG.primary,
                  ...DEFAULT_LOGO_CONFIG.fallbacks,
                  DEFAULT_LOGO_CONFIG.placeholder,
                  '/logo-custom.svg',
                  '/logo-test.png',
                  '/nonexistent-logo.jpg'
                ].map((src) => (
                  <label key={src} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(src)}
                      onChange={() => testLogoSource(src)}
                      className="rounded"
                    />
                    <span className="truncate">{src}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Diagnostic Results */}
          {diagnosticResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Diagnostic Results</h2>
              <div className="overflow-x-auto">
                <table className="w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Logo Source</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Load Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {diagnosticResults.map((result, index) => (
                      <tr key={index} className={result.exists ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="px-4 py-3 text-sm font-mono">{result.src}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.exists 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.exists ? '✅ Available' : '❌ Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {result.loadTime ? `${result.loadTime.toFixed(2)}ms` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          {result.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Health Report */}
          {healthReport && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Health Report</h2>
              <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {healthReport}
              </div>
            </section>
          )}

          {/* Usage Instructions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Usage Instructions</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Network Simulation:</strong> Test logo loading under different network conditions</li>
                <li>• <strong>Run Diagnostics:</strong> Check availability and performance of selected logo sources</li>
                <li>• <strong>Health Report:</strong> View detailed statistics about logo loading performance</li>
                <li>• <strong>Clear Cache:</strong> Reset all cached data and health metrics for fresh testing</li>
                <li>• <strong>Logo Sources:</strong> Select which logo files to test during diagnostics</li>
              </ul>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}