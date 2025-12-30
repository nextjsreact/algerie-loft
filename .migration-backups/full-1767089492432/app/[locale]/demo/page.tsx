import { Metadata } from 'next'
import DualAudienceHomepage from '@/components/homepage/DualAudienceHomepage'

export const metadata: Metadata = {
  title: 'Démo - Homepage Dual-Audience | Loft Algérie',
  description: 'Démonstration de la nouvelle homepage dual-audience pour Loft Algérie - Focus guests et propriétaires',
}

interface DemoPageProps {
  params: {
    locale: string
  }
}

export default function DemoPage({ params }: DemoPageProps) {
  return (
    <div>
      {/* Bandeau de démonstration */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-sm text-yellow-800">
          <strong>🚧 DÉMONSTRATION</strong> - Nouvelle Homepage Dual-Audience - 
          <span className="ml-2">
            {params.locale === 'fr' && 'Ceci est une prévisualisation de la nouvelle page d\'accueil'}
            {params.locale === 'en' && 'This is a preview of the new homepage'}
            {params.locale === 'ar' && 'هذه معاينة للصفحة الرئيسية الجديدة'}
          </span>
        </p>
      </div>
      
      {/* Nouvelle Homepage Dual-Audience */}
      <DualAudienceHomepage locale={params.locale} />
    </div>
  )
}