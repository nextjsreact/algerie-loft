import SimpleLogo from '@/components/simple/SimpleLogo';

export default function TestSimpleLogo() {
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Test Logo Simple</h1>
      
      {/* Barre de menu */}
      <nav className="bg-white shadow h-16 flex items-center px-4 mb-4">
        <SimpleLogo width={80} height={24} />
        <span className="ml-4">Menu</span>
      </nav>

      {/* Logo seul */}
      <div className="bg-gray-100 p-4">
        <SimpleLogo width={80} height={24} />
      </div>
    </div>
  );
}