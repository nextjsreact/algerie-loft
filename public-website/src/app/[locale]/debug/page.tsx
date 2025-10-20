export default function DebugPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green', fontSize: '2rem' }}>
        🎉 SUCCESS! Page Debug Fonctionne!
      </h1>
      <p>Cette page prouve que le routing avec les locales fonctionne maintenant.</p>
      <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <h2>Informations de Debug:</h2>
        <ul>
          <li>✅ Layout des locales fonctionne</li>
          <li>✅ Routing [locale] fonctionne</li>
          <li>✅ Page se compile correctement</li>
          <li>✅ Pas d'erreurs de compilation</li>
        </ul>
      </div>
    </div>
  );
}