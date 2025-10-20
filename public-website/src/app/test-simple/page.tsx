export default function TestPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'green', fontSize: '2rem' }}>✅ Test Simple - Ça marche !</h1>
      <p>Cette page teste si Next.js fonctionne sans i18n</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/fr" style={{ 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px', 
          textDecoration: 'none' 
        }}>
          Tester /fr
        </a>
      </div>
    </div>
  );
}