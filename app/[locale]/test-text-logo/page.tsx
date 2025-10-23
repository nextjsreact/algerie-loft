import TextLogo from '@/components/simple/TextLogo';

export default function TestTextLogo() {
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Logo Texte - Fonctionne Toujours</h1>
      
      {/* Barre de menu avec logo texte */}
      <nav className="bg-white shadow h-16 flex items-center px-4 mb-4 border">
        <TextLogo size="small" />
        <span className="ml-4 text-gray-700">Menu</span>
      </nav>

      {/* Barre plus petite */}
      <nav className="bg-blue-600 text-white h-12 flex items-center px-4 mb-4">
        <TextLogo size="small" className="text-white" />
        <span className="ml-4">Menu Compact</span>
      </nav>

      {/* Très petite barre */}
      <nav className="bg-gray-800 text-white h-10 flex items-center px-4 mb-4">
        <TextLogo size="small" className="text-white text-sm" />
        <span className="ml-2 text-sm">Mini</span>
      </nav>

      <p className="text-gray-600">
        Ce logo texte s'affiche toujours et s'adapte à toutes les tailles de menu.
      </p>
    </div>
  );
}