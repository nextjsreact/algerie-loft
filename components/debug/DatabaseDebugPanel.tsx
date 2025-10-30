'use client';

import { useState, useEffect } from 'react';
import { useDatabaseInitializer } from '@/components/providers/database-initializer';

interface DatabaseStatus {
  initialized: boolean;
  loftCount: number;
  environment: string;
  lastSeeded?: string;
}

/**
 * Database Debug Panel
 * 
 * Development utility for monitoring and controlling database initialization.
 * Only visible in development mode.
 */
export function DatabaseDebugPanel() {
  const { isInitialized, isInitializing, seederResult, error, retryInitialization } = useDatabaseInitializer();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isManualSeeding, setIsManualSeeding] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/init');
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch database status:', error);
    }
  };

  const manualSeed = async (forceReseed = false) => {
    setIsManualSeeding(true);
    try {
      const response = await fetch('/api/database/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceReseed,
          logLevel: 'debug'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Manual seeding result:', data);
        await fetchDatabaseStatus();
      } else {
        const error = await response.json();
        console.error('Manual seeding failed:', error);
      }
    } catch (error) {
      console.error('Manual seeding error:', error);
    } finally {
      setIsManualSeeding(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      fetchDatabaseStatus();
    }
  }, [isInitialized]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50"
        title="Database Debug Panel"
      >
        DB
      </button>

      {/* Debug panel */}
      {showPanel && (
        <div className="fixed bottom-16 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Database Debug</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Initialization Status */}
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Initialization Status</h4>
            
            {isInitializing && (
              <div className="text-blue-600 text-sm flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Initializing...
              </div>
            )}
            
            {isInitialized && !error && (
              <div className="text-green-600 text-sm">✓ Initialized</div>
            )}
            
            {error && (
              <div className="text-red-600 text-sm">✗ Error: {error}</div>
            )}

            {seederResult && (
              <div className="text-xs text-gray-600 mt-1">
                {seederResult.seeded ? (
                  <>Seeded {seederResult.count} lofts in {seederResult.duration}ms</>
                ) : (
                  'No seeding needed'
                )}
                {seederResult.errors.length > 0 && (
                  <div className="text-red-500 mt-1">
                    Errors: {seederResult.errors.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Database Status */}
          {dbStatus && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Database Status</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Environment: {dbStatus.environment}</div>
                <div>Loft Count: {dbStatus.loftCount}</div>
                <div>Initialized: {dbStatus.initialized ? 'Yes' : 'No'}</div>
                {dbStatus.lastSeeded && (
                  <div>Last Seeded: {new Date(dbStatus.lastSeeded).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => fetchDatabaseStatus()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm"
            >
              Refresh Status
            </button>
            
            <button
              onClick={retryInitialization}
              disabled={isInitializing}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Retry Initialization
            </button>
            
            <button
              onClick={() => manualSeed(false)}
              disabled={isManualSeeding}
              className="w-full bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              {isManualSeeding ? 'Seeding...' : 'Manual Seed'}
            </button>
            
            <button
              onClick={() => manualSeed(true)}
              disabled={isManualSeeding}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Force Reseed
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Development mode only
            </div>
          </div>
        </div>
      )}
    </>
  );
}