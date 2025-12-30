'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Customer, getCustomerById } from '@/lib/actions/customers';
import { CustomerDetail } from '@/components/customers/customer-detail';

export default function CustomerDetailPage() {
  const params = useParams();
  const t = useTranslations('customers');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      if (params.id) {
        const fetchedCustomer = await getCustomerById(params.id as string);
        setCustomer(fetchedCustomer);
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white text-lg font-medium">{t('detail.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{t('detail.customerNotFound')}</h1>
          <p className="text-slate-300">{t('detail.customerNotFoundMessage')}</p>
        </div>
      </div>
    );
  }

  return <CustomerDetail customer={customer} />;
}