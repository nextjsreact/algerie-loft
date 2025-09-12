'use client';

import { useTranslations } from 'next-intl';
import { Customer } from '@/lib/actions/customers';
import { CustomersList } from '@/components/customers/customers-list';
import { getCustomers } from '@/lib/actions/customers';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const t = useTranslations('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      const fetchedCustomers = await getCustomers();
      setCustomers(fetchedCustomers);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-6 py-8"><p>{t('loadingCustomers')}</p></div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <CustomersList customers={customers} />
    </div>
  );
}