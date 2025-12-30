import Image from "next/image"

export default async function TestAllLogosPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-12">
          Tous les fichiers logo disponibles
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* logo.jpg */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-center">logo.jpg</h2>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo.jpg" 
                alt="logo.jpg" 
                width={300} 
                height={100} 
                className="w-auto h-auto max-w-full"
              />
            </div>
          </div>

          {/* logo.png */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-center">logo.png</h2>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo.png" 
                alt="logo.png" 
                width={300} 
                height={100} 
                className="w-auto h-auto max-w-full"
              />
            </div>
          </div>

          {/* logo_1.jpg */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-center">logo_1.jpg</h2>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo_1.jpg" 
                alt="logo_1.jpg" 
                width={300} 
                height={100} 
                className="w-auto h-auto max-w-full"
              />
            </div>
          </div>

          {/* logo-fallback.svg */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-center">logo-fallback.svg</h2>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo-fallback.svg" 
                alt="logo-fallback.svg" 
                width={300} 
                height={100} 
                className="w-auto h-auto max-w-full"
              />
            </div>
          </div>

          {/* logo-temp.svg */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4 text-center">logo-temp.svg</h2>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
              <Image 
                src="/logo-temp.svg" 
                alt="logo-temp.svg" 
                width={300} 
                height={100} 
                className="w-auto h-auto max-w-full"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg font-semibold mb-4">
            Dis-moi le nom du fichier que tu veux utiliser partout
          </p>
          <a 
            href={`/${locale}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            ← Retour
          </a>
        </div>
      </div>
    </div>
  )
}
