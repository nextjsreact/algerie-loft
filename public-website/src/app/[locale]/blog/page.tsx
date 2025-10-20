import { useTranslations } from 'next-intl';

export default function BlogPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {t('navigation.blog')}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
          Actualités, conseils et insights sur la gestion immobilière.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <article key={item} className="card">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Article {item}</h3>
            <p className="text-gray-600 text-sm mb-4">
              Extrait de l'article avec les informations principales...
            </p>
            <div className="text-xs text-gray-500">
              Publié le 15 octobre 2024
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}