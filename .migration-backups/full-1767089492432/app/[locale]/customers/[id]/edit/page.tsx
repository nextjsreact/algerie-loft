import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCustomerById } from '@/lib/actions/customers';

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('customers');
  const customer = await getCustomerById(params.id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('editCustomer')}</h1>
      <CustomerForm customer={customer} />
    </div>
  );
}