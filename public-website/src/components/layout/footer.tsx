import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { landmarks } from '@/lib/accessibility';

const quickLinks = [
  { key: 'home', href: '/' },
  { key: 'services', href: '/services' },
  { key: 'portfolio', href: '/portfolio' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
  { key: 'blog', href: '/blog' },
];

const socialLinks = [
  { 
    name: 'Facebook', 
    href: 'https://facebook.com/loftalgerie', 
    icon: Facebook,
    color: 'hover:text-blue-600'
  },
  { 
    name: 'Twitter', 
    href: 'https://twitter.com/loftalgerie', 
    icon: Twitter,
    color: 'hover:text-sky-500'
  },
  { 
    name: 'Instagram', 
    href: 'https://instagram.com/loftalgerie', 
    icon: Instagram,
    color: 'hover:text-pink-600'
  },
  { 
    name: 'LinkedIn', 
    href: 'https://linkedin.com/company/loftalgerie', 
    icon: Linkedin,
    color: 'hover:text-blue-700'
  },
];

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-gray-900 text-white safe-area-bottom"
      role={landmarks.contentinfo}
      id="footer"
    >
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm" aria-hidden="true">LA</span>
              </div>
              <span className="text-lg sm:text-xl font-bold">{t('footer.company')}</span>
            </div>
            <p className="text-gray-300 mb-4 sm:mb-6 max-w-md text-sm sm:text-base leading-relaxed">
              {t('footer.description')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3" role="region" aria-label={t('footer.contactInfo')}>
              <div className="flex items-start space-x-3 text-gray-300">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="sr-only">{t('footer.address')}: </span>
                  <span className="text-xs sm:text-sm">
                    Alger, Algérie
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-gray-300">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="sr-only">{t('footer.phone')}: </span>
                  <a 
                    href="tel:+213XXXXXXXX" 
                    className="text-xs sm:text-sm hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  >
                    +213 XX XX XX XX
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-gray-300">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="sr-only">{t('footer.email')}: </span>
                  <a 
                    href="mailto:contact@loft-algerie.com" 
                    className="text-xs sm:text-sm hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  >
                    contact@loft-algerie.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('footer.quickLinks')}</h3>
            <nav role="navigation" aria-label={t('footer.quickLinksNav')}>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-xs sm:text-sm flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded py-1"
                    >
                      <span>{t(`navigation.${link.key}`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('footer.followUs')}</h3>
            <div className="flex flex-wrap gap-2 sm:gap-4" role="list" aria-label={t('footer.socialLinks')}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 ${social.color} transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center`}
                  aria-label={t(`footer.socialAria.${social.name.toLowerCase()}`)}
                  role="listitem"
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
            
            {/* App Access */}
            <div className="mt-4 sm:mt-6">
              <Link
                href="/app"
                className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[44px] touch-manipulation"
                aria-label={t('footer.appAccessAria')}
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>{t('navigation.app')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
            © {currentYear} {t('footer.company')}. {t('footer.rights')}.
          </p>
          <nav 
            className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6"
            role="navigation"
            aria-label={t('footer.legalNav')}
          >
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded py-1"
            >
              {t('legal.privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded py-1"
            >
              {t('legal.terms')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}