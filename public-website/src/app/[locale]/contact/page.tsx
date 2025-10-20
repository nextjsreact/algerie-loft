import { useTranslations } from 'next-intl';
import { ContactForm } from '@/components/forms';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  MessageCircle,
  Calendar
} from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-mobile-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-mobile-base sm:text-lg text-gray-600 leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-mobile-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                    {t('contact.form.title')}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {t('contact.form.description')}
                  </p>
                </div>
                
                <ContactForm className="w-full" />
              </div>
            </div>

            {/* Contact Information */}
            <div className="order-1 lg:order-2">
              <div className="space-y-6 sm:space-y-8">
                
                {/* Contact Methods */}
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                  <h2 className="text-mobile-xl sm:text-2xl font-semibold text-gray-900 mb-6">
                    {t('contact.info.title')}
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {t('contact.info.address.title')}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          Alger, Algérie<br />
                          {t('contact.info.address.details')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {t('contact.info.phone.title')}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                          +213 XX XX XX XX
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {t('contact.info.phone.hours')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {t('contact.info.email.title')}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                          contact@loft-algerie.com
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {t('contact.info.email.response')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                  <h3 className="text-mobile-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    {t('contact.hours.title')}
                  </h3>
                  
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('contact.hours.weekdays')}</span>
                      <span className="font-medium text-gray-900">9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('contact.hours.saturday')}</span>
                      <span className="font-medium text-gray-900">9:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('contact.hours.sunday')}</span>
                      <span className="font-medium text-gray-900">{t('contact.hours.closed')}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
                  <h3 className="text-mobile-lg sm:text-xl font-semibold text-gray-900 mb-4">
                    {t('contact.quickActions.title')}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="tel:+213XXXXXXXX"
                      className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>{t('contact.quickActions.call')}</span>
                    </a>
                    
                    <a
                      href="mailto:contact@loft-algerie.com"
                      className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span>{t('contact.quickActions.email')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}