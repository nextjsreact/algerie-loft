'use client';

import { useTranslations } from 'next-intl';
import { Customer } from '@/lib/actions/customers';
import { CustomersManagement } from '@/components/customers/customers-management';
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white text-lg font-medium">{t('loadingCustomers')}</p>
          <p className="text-slate-300 text-sm mt-2">{t('hub.intelligentPlatform')}</p>
        </div>
      </div>
    );
  }

  return <CustomersManagement customers={customers} setCustomers={setCustomers} />;
}