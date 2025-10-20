'use client';

import { useEffect, useState } from 'react';
import { Metric } from 'web-vitals';

interface MonitoringData {
  webVitals: Metric[];
  errors: any[];
  performance: any[];
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData>({
    webVitals: [],
    errors: [],
    performance: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Listen for monitoring data
    const handleWebVital = (event: CustomEvent<Metric>) => {
      setData(prev => ({
        ...prev,
        webVitals: [...prev.webVitals.slice(-9), event.detail],
      }));
    };

    const handleError = (event: CustomEvent) => {
      setData(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-9), event.detail],
      }));
    };

    const handlePerformance = (event: CustomEvent) => {
      setData(prev => ({
        ...prev,
        performance: [...prev.performance.slice(-9), event.detail],
      }));
    };

    // Add event listeners
    window.addEventListener('web-vital' as any, handleWebVital);
    window.addEventListener('monitoring-error' as any, handleError);
    window.addEventListener('monitoring-performance' as any, handlePerformance);

    return () => {
      window.removeEventListener('web-vital' as any, handleWebVital);
      window.removeEventListener('monitoring-error' as any, handleError);
      window.removeEventListener('monitoring-performance' as any, handlePerformance);
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        📊 Monitoring
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {/* Web Vitals */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Web Vitals</h4>
            <div className="space-y-1 text-sm">
              {data.webVitals.slice(-3).map((vital, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{vital.name}:</span>
                  <span className={`font-mono ${
                    vital.rating === 'good' ? 'text-green-600' :
                    vital.rating === 'needs-improvement' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {vital.value.toFixed(2)} ({vital.rating})
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Errors */}
          {data.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Recent Errors</h4>
              <div className="space-y-1 text-sm">
                {data.errors.slice(-3).map((error, index) => (
                  <div key={index} className="text-red-600 truncate">
                    {error.message || error.toString()}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Performance */}
          {data.performance.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Performance</h4>
              <div className="space-y-1 text-sm">
                {data.performance.slice(-3).map((perf, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 truncate">{perf.name}:</span>
                    <span className="font-mono text-blue-600">
                      {perf.duration?.toFixed(2)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {data.webVitals.length === 0 && data.errors.length === 0 && data.performance.length === 0 && (
            <div className="text-gray-500 text-sm text-center py-4">
              No monitoring data yet...
            </div>
          )}
        </div>
      )}
    </div>
  );
}