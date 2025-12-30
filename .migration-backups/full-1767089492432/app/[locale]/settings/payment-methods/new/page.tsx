import { requireRole } from "@/lib/auth"
import { PaymentMethodForm } from "@/components/forms/payment-method-form"
import { createPaymentMethod } from "@/app/actions/payment-methods"

export default async function NewPaymentMethodPage() {
  await requireRole(["admin", "manager"])

  return (
    <div className="container mx-auto py-8">
      <PaymentMethodForm action={createPaymentMethod} />
    </div>
  )
}