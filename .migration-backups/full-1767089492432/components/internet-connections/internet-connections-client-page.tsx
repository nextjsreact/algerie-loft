"use client";

import { getInternetConnectionTypes, deleteInternetConnectionType } from '@/app/actions/internet-connections';
import { Heading } from '@/components/ui/heading';
import { InternetConnectionTypeForm } from '@/components/forms/internet-connection-type-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { InternetConnectionType } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';

export default function InternetConnectionsClientPage({
  initialInternetConnectionTypes,
}: {
  initialInternetConnectionTypes: InternetConnectionType[];
}) {
  const t = useTranslations('internetConnections');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [internetConnectionTypes, setInternetConnectionTypes] = useState<InternetConnectionType[]>(initialInternetConnectionTypes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInternetConnectionTypes(initialInternetConnectionTypes);
  }, [initialInternetConnectionTypes]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInternetConnectionType(id);
      toast.success(t('deleteSuccess'));
      setInternetConnectionTypes(internetConnectionTypes.filter(ict => ict.id !== id));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const onCreated = (newType: InternetConnectionType) => {
    setInternetConnectionTypes([newType, ...internetConnectionTypes]);
  };

  return (
    <div className="bg-blue-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <Heading title={t('title')} description={t('subtitle')} />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('addNewConnectionType')}</h2>
          <InternetConnectionTypeForm onCreated={onCreated} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('existingConnectionTypes')}</h2>
          {internetConnectionTypes && internetConnectionTypes.length > 0 ? (
            <ul className="space-y-4">
              {internetConnectionTypes.map((ict) => (
                <li key={ict.id} className="p-4 border rounded-md shadow-sm bg-white flex justify-between items-center">
                  <div>
                    <p className="font-medium">{ict.type} ({ict.speed} from {ict.provider})</p>
                    <p className="text-sm text-gray-600">{t('status')}: {ict.status}, {t('cost')}: {ict.cost}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/${locale}/settings/internet-connections/${ict.id}`}>
                      <Button variant="outline" size="sm">{tCommon('edit')}</Button>
                    </Link>
                    <form action={() => handleDelete(ict.id)}>
                      <Button type="submit" variant="destructive" size="sm">{tCommon('delete')}</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('noConnectionTypesFound')}</p>
          )}
        </div>
      </div>
    </div>
  );
}