"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { z } from "zod"
import type { Database } from "@/lib/types"

type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']

const paymentMethodSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().optional(),
  details: z.string().optional(), // Store JSON string for details
})

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod
  action: (formData: FormData) => Promise<{ error?: string, paymentMethod?: PaymentMethod }>
}

export function PaymentMethodForm({ paymentMethod, action }: PaymentMethodFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const t = useTranslations('paymentMethods')
  const tCommon = useTranslations('common')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: paymentMethod
      ? {
          name: paymentMethod.name,
          type: paymentMethod.type || "",
          details: paymentMethod.details 
            ? (typeof paymentMethod.details === 'string' 
                ? paymentMethod.details 
                : JSON.stringify(paymentMethod.details, null, 2))
            : "",
        }
      : {
          name: "",
          type: "",
          details: "",
        },
  })

  const handleFormSubmit = async (data: PaymentMethodFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.type) formData.append("type", data.type);
      if (data.details) formData.append("details", data.details);

      const result = await action(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
        router.push("/settings/payment-methods")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête du formulaire */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {paymentMethod ? t('editPaymentMethod') : t('newPaymentMethod')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {paymentMethod ? t('updatePaymentMethodInfo') : t('configureNewMethod')}
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire principal */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/20 border-b border-slate-200/50 dark:border-gray-700/50 p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                {t('paymentInformation')}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                {t('fillMethodDetails')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      {t('methodName')} *
                    </Label>
                    <Input 
                      id="name" 
                      {...register("name")} 
                      className="h-12 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder={`${tCommon('name')}...`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      {t('paymentType')}
                    </Label>
                    <Select onValueChange={(value) => setValue("type", value)}>
                      <SelectTrigger className="h-12 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 rounded-xl text-base">
                        <SelectValue placeholder={tCommon('selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">{t('creditCard')}</SelectItem>
                        <SelectItem value="cash">{t('cash')}</SelectItem>
                        <SelectItem value="bank_transfer">{t('bankTransfer')}</SelectItem>
                        <SelectItem value="mobile_payment">{t('mobilePayment')}</SelectItem>
                        <SelectItem value="check">{t('check')}</SelectItem>
                        <SelectItem value="other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="details" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {t('additionalDetails')}
                  </Label>
                  <Textarea 
                    id="details" 
                    {...register("details")} 
                    rows={6} 
                    className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                    placeholder={t('details')}
                  />
                  {errors.details && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.details.message}
                    </p>
                  )}
                </div>

                {/* Boutons d'action parfaitement alignés */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 dark:border-gray-700">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    size="lg"
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('saving')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5" />
                        {paymentMethod ? t('updatePaymentMethod') : t('createPaymentMethod')}
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    onClick={() => router.back()}
                    className="h-12 px-8 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-semibold transition-all duration-200"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
