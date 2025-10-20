export default function EnglishPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          🇺🇸 Loft Algeria - English Version
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          ✅ English page working with localized content
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f0fdf4', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          🏠 Professional Loft Management
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
          Professional loft and accommodation management services in Algeria. 
          Maximize your rental income with our expertise.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/en-page/contact" style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Contact us →
          </a>
          <a href="/en-page/portfolio" style={{ 
            backgroundColor: 'white', 
            color: '#10b981', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            border: '2px solid #10b981',
            fontWeight: '500'
          }}>
            ▶ View our work
          </a>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Property Management</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Complete management of your real estate with personalized monitoring.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Reservations</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Optimized booking system to maximize your occupancy rate.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Maintenance</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>Preventive and corrective maintenance service for your properties.</p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <a href="/" style={{ color: '#10b981', textDecoration: 'none', marginRight: '1rem' }}>← Back to home</a>
          <a href="/fr-page" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '1rem' }}>🇫🇷 Français</a>
          <a href="/ar-page" style={{ color: '#f59e0b', textDecoration: 'none' }}>🇩🇿 العربية</a>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>&copy; 2024 Loft Algeria - All rights reserved</p>
      </div>
    </div>
  );
}