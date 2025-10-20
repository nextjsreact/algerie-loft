export default function DebugTestPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'green', fontSize: '2rem' }}>✅ Debug Test - Next.js fonctionne !</h1>
      <p>Cette page teste si Next.js fonctionne sans i18n</p>
      <p>URL: /debug-test</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/fr" style={{ 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px', 
          textDecoration: 'none',
          marginRight: '1rem'
        }}>
          Tester /fr
        </a>
        <a href="/test-simple" style={{ 
          backgroundColor: '#10b981', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px', 
          textDecoration: 'none' 
        }}>
          Tester /test-simple
        </a>
      </div>
    </div>
  );
}