interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className = '' }: MainLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#1f2937', color: 'white', padding: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🏠 Loft Algérie</h1>
        <nav style={{ marginTop: '0.5rem' }}>
          <a href="/fr" style={{ color: 'white', marginRight: '1rem' }}>Accueil</a>
          <a href="/fr/services" style={{ color: 'white', marginRight: '1rem' }}>Services</a>
          <a href="/fr/portfolio" style={{ color: 'white', marginRight: '1rem' }}>Portfolio</a>
          <a href="/fr/contact" style={{ color: 'white' }}>Contact</a>
        </nav>
      </header>
      
      <main style={{ flex: 1, padding: '2rem' }} className={className}>
        {children}
      </main>
      
      <footer style={{ backgroundColor: '#f3f4f6', padding: '1rem', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>&copy; 2024 Loft Algérie - Tous droits réservés</p>
      </footer>
    </div>
  );
}