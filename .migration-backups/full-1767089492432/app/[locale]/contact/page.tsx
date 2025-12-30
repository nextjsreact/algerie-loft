import PublicHeader from "@/components/public/PublicHeader"
import PublicFooter from "@/components/public/PublicFooter"
import { ContactPageClient } from "@/components/contact/contact-page-client"

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  
  const headerText = {
    fr: { login: "Connexion", clientArea: "Espace Client", contact: "Contact", allRightsReserved: "Tous droits réservés" },
    en: { login: "Login", clientArea: "Client Area", contact: "Contact", allRightsReserved: "All rights reserved" },
    ar: { login: "تسجيل الدخول", clientArea: "منطقة العميل", contact: "اتصال", allRightsReserved: "جميع الحقوق محفوظة" }
  }
  const text = headerText[locale as keyof typeof headerText] || headerText.fr

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader locale={locale} text={{ login: text.login }} />
      <ContactPageClient locale={locale} />
      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
    </div>
  )
}