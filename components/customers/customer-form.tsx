'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Customer } from '@/lib/actions/customers';
import { toast } from 'sonner';

interface CustomerFormProps {
  customer?: Customer; // Optional, for editing
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const t = useTranslations('customers');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    status: customer?.status || 'prospect',
    notes: customer?.notes || '',
    current_loft_id: customer?.current_loft_id || '', // Assuming you might have a way to select lofts
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = customer?.id ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(customer ? t('updateError') : t('createError'), {
          description: result.error || t('unknownError'),
        });
      } else {
        toast.success(customer ? t('updateSuccess') : t('createSuccess'));
        router.push('/customers');
      }
    } catch (error) {
      toast.error(t('createError'), {
        description: error instanceof Error ? error.message : t('unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="first_name">{t('firstName')}</Label>
        <Input
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="last_name">{t('lastName')}</Label>
        <Input
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">{t('phone')}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="status">{t('status')}</Label>
        <Select
          name="status"
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as 'prospect' | 'active' | 'former' })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospect">{t('statusOptions.prospect')}</SelectItem>
            <SelectItem value="active">{t('statusOptions.active')}</SelectItem>
            <SelectItem value="former">{t('statusOptions.former')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      {/* You might add a Loft selection here if needed */}
      {/* <div>
        <Label htmlFor="current_loft_id">{t('currentLoft')}</Label>
        <Input
          id="current_loft_id"
          name="current_loft_id"
          value={formData.current_loft_id}
          onChange={(e) => setFormData({ ...formData, current_loft_id: e.target.value })}
        />
      </div> */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : customer ? t('updateCustomer') : t('createCustomer')}
      </Button>
    </form>
  );
}