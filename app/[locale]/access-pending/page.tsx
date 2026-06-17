import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Home, Mail } from 'lucide-react';

interface AccessPendingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccessPendingPage({ params }: AccessPendingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.accessPending' });
  const isRTL = locale === 'ar';

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-base">{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className={`text-sm text-blue-800 dark:text-blue-300 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('message')}
              </p>
            </div>
          </div>

          <a href={`/${locale}`} className="block">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              {t('backHome')}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
