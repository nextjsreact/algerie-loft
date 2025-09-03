'use client'

import { useState, useEffect } from 'react';
import { useTranslationStats } from '@/components/providers/optimized-intl-provider';
import { useBundleAnalyzer } from '@/lib/utils/bundle-analyzer';

/**
 * Composant de monitoring des performances de traduction (développement uniquement)
 */
export function TranslationMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'cache' | 'bundle' | 'usage'>('cache');
  const stats = useTranslationStats();
  const bundleAnalyzer = useBundleAnalyzer();
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);

  // Ne s'affiche qu'en développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    // Charger l'analyse des bundles
    bundleAnalyzer.analyze().then(setBundleAnalysis);
    
    // Charger les stats d'utilisation
    setUsageStats(bundleAnalyzer.getStats());
  }, [bundleAnalyzer]);

  useEffect(() => {
    // Raccourci clavier pour afficher/masquer le monitor
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
          zIndex: 10000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
        title="Translation Monitor (Ctrl+Shift+T)"
      >
        🌐
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 10000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f5f5f5',
        borderRadius: '8px 8px 0 0'
      }}>
        <span style={{ fontWeight: 'bold' }}>Translation Monitor</span>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #eee'
      }}>
        {(['cache', 'bundle', 'usage'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              background: activeTab === tab ? '#007acc' : 'transparent',
              color: activeTab === tab ? 'white' : 'black',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        padding: '10px',
        maxHeight: '350px',
        overflowY: 'auto'
      }}>
        {activeTab === 'cache' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>Cache Statistics</h4>
            {stats ? (
              <div>
                <div><strong>Server Cache:</strong></div>
                <div>Size: {stats.server?.size || 0} entries</div>
                <div>Hit Rate: {stats.server?.hitRate || 0}%</div>
                
                <div style={{ marginTop: '10px' }}><strong>Client Cache:</strong></div>
                <div>Size: {stats.client?.size || 0} entries</div>
                <div>Hits: {stats.client?.hits || 0}</div>
                <div>Misses: {stats.client?.misses || 0}</div>
                <div>Hit Rate: {stats.client?.hitRate || 0}%</div>
                
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
                  Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div>Loading cache stats...</div>
            )}
          </div>
        )}

        {activeTab === 'bundle' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>Bundle Analysis</h4>
            {bundleAnalysis ? (
              <div>
                <div><strong>Total Size:</strong> {Math.round(bundleAnalysis.translationSize / 1024)}KB</div>
                
                <div style={{ marginTop: '10px' }}><strong>By Language:</strong></div>
                {Object.entries(bundleAnalysis.languageBreakdown).map(([lang, size]: [string, any]) => (
                  <div key={lang}>
                    {lang}: {Math.round(size / 1024)}KB
                  </div>
                ))}
                
                <div style={{ marginTop: '10px' }}><strong>Top Namespaces:</strong></div>
                {Object.entries(bundleAnalysis.namespaceBreakdown)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([ns, size]: [string, any]) => (
                    <div key={ns}>
                      {ns}: {Math.round(size / 1024)}KB
                    </div>
                  ))}
                
                {bundleAnalysis.recommendations.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Recommendations:</strong>
                    {bundleAnalysis.recommendations.map((rec: string, i: number) => (
                      <div key={i} style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                        • {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>Loading bundle analysis...</div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>Usage Statistics</h4>
            {usageStats ? (
              <div>
                <div><strong>Total Tracked:</strong> {usageStats.totalTracked}</div>
                
                <div style={{ marginTop: '10px' }}><strong>Most Used:</strong></div>
                {usageStats.mostUsed.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} style={{ fontSize: '10px' }}>
                    {item.namespace}.{item.key} ({item.usageCount}x)
                  </div>
                ))}
                
                <div style={{ marginTop: '10px' }}><strong>Least Used:</strong></div>
                {usageStats.leastUsed.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} style={{ fontSize: '10px', color: '#666' }}>
                    {item.namespace}.{item.key} ({item.usageCount}x)
                  </div>
                ))}
              </div>
            ) : (
              <div>Loading usage stats...</div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px',
        borderTop: '1px solid #eee',
        display: 'flex',
        gap: '5px'
      }}>
        <button
          onClick={() => {
            bundleAnalyzer.generateReport().then(report => {
              console.log(report);
              alert('Report generated in console');
            });
          }}
          style={{
            flex: 1,
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Generate Report
        </button>
        <button
          onClick={() => {
            window.location.reload();
          }}
          style={{
            flex: 1,
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}