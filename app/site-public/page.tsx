export default function SitePublicPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          🎉 Site Public Loft Algérie - FONCTIONNEL !
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          ✅ Intégré dans l'application principale qui fonctionne
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f0f9ff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '1rem' }}>🏠 Loft Algérie - Site Public</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
          Services professionnels de gestion de lofts et hébergements en Algérie. 
          Maximisez vos revenus locatifs avec notre expertise.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏢</div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Gestion de Propriétés</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Gestion complète de vos biens immobiliers</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Réservations</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Système optimisé pour maximiser l'occupation</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔧</div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Maintenance</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Service préventif et correctif</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Conseil</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Expertise pour optimiser vos investissements</p>
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fef3c7', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>🌐 Langues disponibles</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/site-public/fr" style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            🇫🇷 Français
          </a>
          <a href="/site-public/en" style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            🇺🇸 English
          </a>
          <a href="/site-public/ar" style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            🇩🇿 العربية
          </a>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#dcfce7', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ color: '#166534', marginBottom: '1rem' }}>🔗 Navigation</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/login" style={{ 
            backgroundColor: '#16a34a', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            🔐 Accéder à l'application
          </a>
          <a href="/" style={{ 
            backgroundColor: '#6b7280', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            🏠 Dashboard principal
          </a>
        </div>
      </div>
    </div>
  );
}