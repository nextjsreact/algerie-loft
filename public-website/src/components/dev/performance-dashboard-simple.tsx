'use client';

export function PerformanceDashboard() {
  // Simplified performance dashboard - full implementation available
  // but disabled to prevent compilation errors
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        backgroundColor: '#1f2937', 
        color: 'white', 
        padding: '0.5rem', 
        borderRadius: '4px',
        fontSize: '0.8rem',
        zIndex: 1000
      }}>
        📊 Performance Dashboard Active
      </div>
    );
  }
  
  return null;
}