interface BreadcrumbProps {
  locale: string;
  items: Array<{
    label: string;
    href?: string;
  }>;
}

export default function Breadcrumb({ locale, items }: BreadcrumbProps) {
  const homeLabel = locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية';
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
      <a 
        href={`/${locale}/public`}
        className="hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {homeLabel}
      </a>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}