'use client';

import { usePerformance, usePageLoadTime } from '@/hooks/use-performance';
import { useState, useEffect } from 'react';

export function PerformanceDashboard() {
  const { metrics, isLoading, performanceScore } = usePerformance();
  const loadTime = usePageLoadTime();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const formatTime = (time: number | undefined) => {
    if (!time) return 'N/A';
    return `${Math.round(time)}ms`;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading metrics...</div>
      ) : (
        <div className="space-y-2 text-xs">
          {performanceScore !== null && (
            <div className="flex justify-between">
              <span>Performance Score:</span>
              <span className={`font-medium ${getScoreColor(performanceScore)}`}>
                {Math.round(performanceScore)}/100
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Page Load:</span>
            <span>{formatTime(loadTime)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>FCP:</span>
            <span>{formatTime(metrics.firstContentfulPaint)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>LCP:</span>
            <span>{formatTime(metrics.largestContentfulPaint)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>CLS:</span>
            <span>{metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span>FID:</span>
            <span>{formatTime(metrics.firstInputDelay)}</span>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t text-xs text-gray-500">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}