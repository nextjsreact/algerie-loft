import { useTranslations } from 'next-intl';

export default function DebugPage() {
  const t = useTranslations('DebugPage');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-600 mb-6">
          🎉 {t('title')}
        </h1>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">{t('infoTitle')}:</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {t('checks.nextjs')}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {t('checks.routing')}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {t('checks.i18n')}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {t('checks.tailwind')}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {t('checks.components')}
            </li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-3">{t('nextStepsTitle')}:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>{t('nextSteps.sentry')}</li>
            <li>{t('nextSteps.analytics')}</li>
            <li>{t('nextSteps.testing')}</li>
            <li>{t('nextSteps.deployment')}</li>
          </ol>
        </div>
        
        <div className="mt-6 flex gap-4">
          <a 
            href="/" 
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium inline-block"
          >
            ← {t('backHome')}
          </a>
          <a 
            href="/fr/debug" 
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium inline-block"
          >
            🇫🇷 Français
          </a>
          <a 
            href="/en/debug" 
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-medium inline-block"
          >
            🇬🇧 English
          </a>
          <a 
            href="/ar/debug" 
            className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 font-medium inline-block"
          >
            🇩🇿 العربية
          </a>
        </div>
      </div>
    </div>
  );
}