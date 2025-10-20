export default function SimpleWorkingPage() {
  return (
    <html>
      <head>
        <title>Test Simple</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
        <h1 style={{ color: 'green', fontSize: '2rem' }}>
          🎉 SUCCESS! Page Simple Fonctionne!
        </h1>
        <p>Cette page ne dépend pas du système i18n.</p>
        <div style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <h2>Test de Routing:</h2>
          <ul>
            <li>✅ Cette page fonctionne sans i18n</li>
            <li>✅ Next.js routing de base fonctionne</li>
            <li>✅ Pas de dépendances complexes</li>
          </ul>
        </div>
      </body>
    </html>
  );
}