import { Metadata } from 'next'
import { PartnerRegistrationSuccess } from '@/components/auth/partner-registration-success'

export const metadata: Metadata = {
  title: 'Inscription réussie - Partenaire - Loft Algérie',
  description: 'Votre demande de compte partenaire a été soumise avec succès',
}

interface PartnerSuccessPageProps {
  params: {
    locale: string
  }
}

export default function PartnerSuccessPage({ params }: PartnerSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <PartnerRegistrationSuccess locale={params.locale} />
    </div>
  )
}