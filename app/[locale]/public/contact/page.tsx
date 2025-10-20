import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import ContactForm from '@/components/public/ContactForm';
import Breadcrumb from '@/components/public/Breadcrumb';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  
  const content = {
    fr: {
      title: "Contactez-nous",
      subtitle: "Prêt à maximiser vos revenus locatifs ? Contactez notre équipe d'experts.",
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés",
      form: {
        name: "Nom complet",
        email: "Email",
        phone: "Téléphone",
        subject: "Sujet",
        message: "Message",
        send: "Envoyer le message"
      },
      info: {
        title: "Informations de contact",
        address: "Alger, Algérie",
        hours: "Lun - Ven: 9h00 - 18h00"
      }
    },
    en: {
      title: "Contact Us",
      subtitle: "Ready to maximize your rental income? Contact our team of experts.",
      login: "Login",
      clientArea: "Client Area",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      form: {
        name: "Full Name",
        email: "Email",
        phone: "Phone",
        subject: "Subject",
        message: "Message",
        send: "Send Message"
      },
      info: {
        title: "Contact Information",
        address: "Algiers, Algeria",
        hours: "Mon - Fri: 9:00 AM - 6:00 PM"
      }
    },
    ar: {
      title: "اتصل بنا",
      subtitle: "مستعد لزيادة دخلك الإيجاري؟ اتصل بفريق الخبراء لدينا.",
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال",
      allRightsReserved: "جميع الحقوق محفوظة",
      form: {
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        subject: "الموضوع",
        message: "الرسالة",
        send: "إرسال الرسالة"
      },
      info: {
        title: "معلومات الاتصال",
        address: "الجزائر العاصمة، الجزائر",
        hours: "الإثنين - الجمعة: 9:00 ص - 6:00 م"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb */}
          <Breadcrumb 
            locale={locale} 
            items={[{ label: text.title }]} 
          />
          
          {/* Header */}
          <section className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {text.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {text.subtitle}
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg dark:shadow-2xl">
              <ContactForm locale={locale} />
            </div>

            {/* Contact Information */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg dark:shadow-2xl">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  {text.info.title}
                </h3>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📧</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Email</p>
                      <a href="mailto:contact@loft-algerie.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm sm:text-base break-all">
                        contact@loft-algerie.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📞</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Téléphone</p>
                      <a href="tel:+213123456789" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm sm:text-base">
                        +213 123 456 789
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📍</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Adresse</p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{text.info.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🕒</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Horaires</p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{text.info.hours}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
    </div>
  );
}