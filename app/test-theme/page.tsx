'use client';

import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function TestThemePage() {
  const { theme, mounted } = useTheme();

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Test du Mode Dark/Light</h1>
        
        <div className="mb-8">
          <p className="text-lg mb-4">Thème actuel : <strong>{theme}</strong></p>
          <p className="text-lg mb-4">Mounted : <strong>{mounted ? 'Oui' : 'Non'}</strong></p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Toggle Buttons</h2>
          <div className="flex space-x-4">
            <ThemeToggle variant="default" />
            <ThemeToggle variant="golden" />
            <ThemeToggle variant="emerald" />
            <ThemeToggle variant="slate" />
            <ThemeToggle variant="orange" />
          </div>
        </div>

        <div className={`p-6 rounded-lg border transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-xl font-semibold mb-4">Test de Contenu</h3>
          <p>
            Ce contenu devrait changer de couleur selon le thème sélectionné.
            Cliquez sur les boutons ci-dessus pour tester le basculement.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => window.location.href = '/fr/style-variant-7'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tester Style Variant 7
          </button>
        </div>
      </div>
    </div>
  );
}