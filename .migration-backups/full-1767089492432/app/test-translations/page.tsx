import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

export default function TestTranslationsPage() {
  const t = useTranslations('landing');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Landing Translations</h1>

      <div className="space-y-2">
        <p><strong>landing.title:</strong> {t('title')}</p>
        <p><strong>landing.subtitle:</strong> {t('subtitle')}</p>
        <p><strong>landing.description:</strong> {t('description')}</p>
        <p><strong>landing.getStarted:</strong> {t('getStarted')}</p>
      </div>
    </div>
  );
}
