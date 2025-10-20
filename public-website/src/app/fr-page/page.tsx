export default function FrenchPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          🇫🇷 Loft Algérie - Version Française
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          ✅ Page française fonctionnelle avec contenu localisé
        </p>
      </div>
      
      <div style={{ backgroundColor: '#eff6ff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          🏠 Gestion Professionnelle de Lofts
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
          Services professionnels de gestion de lofts et hébergements en Algérie. 
          Maximisez vos revenus locatifs avec notre expertise.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/fr-page/contact" style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Nous contacter →
          </a>
          <a href="/fr-page/portfolio" style={{ 
            backgroundColor: 'white', 
            color: '#3b82f6', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            border: '2px solid #3b82f6',
            fontWeight: '500'
          }}>
            ▶ Voir nos réalisations
          </a>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Gestion de Propriétés</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Gestion complète de vos biens immobiliers avec suivi personnalisé.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Réservations</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Système de réservation optimisé pour maximiser votre taux d'occupation.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Maintenance</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Service de maintenance préventive et corrective pour vos propriétés.</p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '1rem' }}>← Retour à l'accueil</a>
          <a href="/en-page" style={{ color: '#10b981', textDecoration: 'none', marginRight: '1rem' }}>🇺🇸 English</a>
          <a href="/ar-page" style={{ color: '#f59e0b', textDecoration: 'none' }}>🇩🇿 العربية</a>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>&copy; 2024 Loft Algérie - Tous droits réservés</p>
      </div>
    </div>
  );
}