import Image from "next/image"
import RobustLogo from "@/components/futuristic/RobustLogo"

export default async function DemoLogosPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comparaison des Logos
          </h1>
          <p className="text-gray-600">
            Comparaison entre le logo de la page d'accueil et celui du dashboard client
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Logo Page d'accueil */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Logo Page d'Accueil
            </h2>
            <div className="bg-gray-900 p-8 rounded-lg mb-4 flex items-center justify-center min-h-[200px]">
              <RobustLogo variant="header" />
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Composant:</strong> RobustLogo</p>
              <p><strong>Variant:</strong> header</p>
              <p><strong>Fichier:</strong> components/futuristic/RobustLogo.tsx</p>
              <p><strong>Utilisé dans:</strong> components/public/PublicHeader.tsx</p>
            </div>
          </div>

          {/* Logo Dashboard Client */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Logo Dashboard Client
            </h2>
            <div className="bg-gray-900 p-8 rounded-lg mb-4 flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo.jpg" 
                alt="Loft Algérie Dashboard" 
                width={140} 
                height={48} 
                priority
                className="h-12 w-auto object-contain max-h-12"
              />
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Composant:</strong> Image (Next.js)</p>
              <p><strong>Source:</strong> /logo.jpg</p>
              <p><strong>Dimensions:</strong> 140x48px</p>
              <p><strong>Utilisé dans:</strong> components/layout/desktop-header.tsx</p>
            </div>
          </div>
        </div>

        {/* Variantes du RobustLogo */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Variantes du RobustLogo
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-gray-900 p-6 rounded-lg mb-3 flex items-center justify-center min-h-[150px]">
                <RobustLogo variant="header" />
              </div>
              <p className="font-semibold">Header</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-900 p-6 rounded-lg mb-3 flex items-center justify-center min-h-[150px]">
                <RobustLogo variant="footer" />
              </div>
              <p className="font-semibold">Footer</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-900 p-6 rounded-lg mb-3 flex items-center justify-center min-h-[150px]">
                <RobustLogo variant="compact" />
              </div>
              <p className="font-semibold">Compact</p>
            </div>
          </div>
        </div>

        {/* Fichier logo.jpg */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Fichier /logo.jpg (Taille réelle)
          </h2>
          <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center">
            <Image 
              src="/logo.jpg" 
              alt="Logo original" 
              width={500} 
              height={200} 
              className="w-auto h-auto max-w-full"
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Fichier image statique utilisé dans le DesktopHeader
          </p>
        </div>

        {/* Retour */}
        <div className="text-center">
          <a 
            href={`/${locale}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
