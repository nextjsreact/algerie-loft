import { getTranslations } from 'next-intl/server';
import { CustomerForm } from '@/components/customers/customer-form';

export default async function NewCustomerPage() {
  const t = await getTranslations('customers');

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('newCustomer')}</h1>
      <CustomerForm />
    </div>
  );
}