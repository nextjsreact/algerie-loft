
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BillPaymentForm } from '@/components/forms/bill-payment-form'
import { useTranslations } from 'next-intl'

interface BillPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  loftId: string
  loftName: string
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet' | 'tv' | 'gas'
  dueDate: string
  onSuccess: () => void
}

export function BillPaymentModal({
  isOpen,
  onClose,
  loftId,
  loftName,
  utilityType,
  dueDate,
  onSuccess
}: BillPaymentModalProps) {
  const t = useTranslations('bills');

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('paymentModal.title')}</DialogTitle>
        </DialogHeader>
        <BillPaymentForm
          loftId={loftId}
          loftName={loftName}
          utilityType={utilityType}
          dueDate={dueDate}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
