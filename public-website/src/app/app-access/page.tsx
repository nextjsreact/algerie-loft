export default function AppAccessPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#7c3aed', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          🔐 Accès à l'Application Loft Algérie
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          ✅ Page d'accès fonctionnelle - Connexion à votre espace de gestion
        </p>
      </div>
      
      <div style={{ backgroundColor: '#faf5ff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏢</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Espace de Gestion des Propriétés
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
          Connectez-vous à votre tableau de bord pour gérer vos propriétés, 
          consulter les réservations et suivre vos revenus.
        </p>
        
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
            Connexion Sécurisée
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input 
              type="email" 
              placeholder="votre@email.com"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Mot de passe
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <button style={{ 
            width: '100%',
            backgroundColor: '#7c3aed', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '6px', 
            border: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}>
            🔐 Se connecter
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem' }}>
              Mot de passe oublié ?
            </a>
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>ℹ️ Informations importantes</h3>
        <ul style={{ color: '#1e40af', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
          <li>Cette page simule l'accès à l'application de gestion</li>
          <li>Dans la version finale, elle sera connectée à votre application principale</li>
          <li>Les utilisateurs authentifiés seront redirigés automatiquement</li>
          <li>Support des sessions partagées entre les deux applications</li>
        </ul>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <a href="/" style={{ color: '#7c3aed', textDecoration: 'none', marginRight: '1rem' }}>← Retour à l'accueil</a>
          <a href="/fr-page" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '1rem' }}>🇫🇷 Français</a>
          <a href="/en-page" style={{ color: '#10b981', textDecoration: 'none', marginRight: '1rem' }}>🇺🇸 English</a>
          <a href="/ar-page" style={{ color: '#f59e0b', textDecoration: 'none' }}>🇩🇿 العربية</a>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>&copy; 2024 Loft Algérie - Accès sécurisé</p>
      </div>
    </div>
  );
}