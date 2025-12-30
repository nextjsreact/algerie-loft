import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import Image from 'next/image';

export default function LogoDebug() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Debug Logo</h1>
      
      {/* Test 1: Image Next.js directe */}
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="font-bold mb-4">Test 1: Image Next.js directe</h2>
        <Image 
          src="/logo.jpg" 
          alt="Logo direct" 
          width={60} 
          height={20}
          className="border border-red-500"
        />
      </div>

      {/* Test 2: HeaderLogo component */}
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="font-bold mb-4">Test 2: HeaderLogo component (60x20px)</h2>
        <div className="border border-blue-500 inline-block">
          <HeaderLogo />
        </div>
      </div>

      {/* Test 3: Dans une barre de menu */}
      <div className="mb-8">
        <h2 className="font-bold mb-4">Test 3: Dans barre de menu (h-12 = 48px)</h2>
        <nav className="bg-white shadow h-12 flex items-center px-4 border">
          <HeaderLogo />
          <span className="ml-4 text-gray-700">Menu</span>
        </nav>
      </div>

      {/* Test 4: Barre encore plus petite */}
      <div className="mb-8">
        <h2 className="font-bold mb-4">Test 4: Barre mini (h-8 = 32px)</h2>
        <nav className="bg-gray-800 text-white h-8 flex items-center px-4 border">
          <HeaderLogo />
          <span className="ml-2 text-sm">Mini</span>
        </nav>
      </div>

      {/* Info */}
      <div className="bg-yellow-100 p-4 rounded">
        <p><strong>Dimensions actuelles HeaderLogo :</strong> 60x20px, max-h-5 (20px)</p>
        <p><strong>Si vous ne voyez pas l'image :</strong> Problème de chargement du fichier /logo.jpg</p>
      </div>
    </div>
  );
}