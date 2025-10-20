interface PublicFooterProps {
  locale: string;
  text: {
    clientArea: string;
    contact: string;
    allRightsReserved: string;
  };
}

export default function PublicFooter({ locale, text }: PublicFooterProps) {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="mb-4 text-gray-300 dark:text-gray-400">&copy; 2024 Loft Algérie - {text.allRightsReserved}</p>
          <div className="flex justify-center space-x-8">
            <a 
              href={`/${locale}/login`} 
              className="text-blue-300 dark:text-blue-400 hover:text-blue-200 dark:hover:text-blue-300 transition-colors"
            >
              {text.clientArea}
            </a>
            <a 
              href="mailto:contact@loft-algerie.com" 
              className="text-blue-300 dark:text-blue-400 hover:text-blue-200 dark:hover:text-blue-300 transition-colors"
            >
              {text.contact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}