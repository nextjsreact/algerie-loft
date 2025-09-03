"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { transactionSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Tag
} from 'lucide-react'

const statusOptions = ["pending", "completed", "failed"] as const
const typeOptions = ["income", "expense"] as const

export function NewTransactionForm({ onSubmit }: { 
  onSubmit: (data: z.infer<typeof transactionSchema>) => Promise<void> 
}) {
  const t = useTranslations("transactions");
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<z.infer<typeof transactionSchema>>({
    defaultValues: {
      transaction_type: "income",
      status: "completed",
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0]
    }
  })

  const transactionType = watch("transaction_type")
  const status = watch("status")

  const getTypeIcon = (type: string) => {
    return type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 rounded-xl">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {t('quickTransaction', { ns: 'transactions' })}
        </h2>
        <p className="text-gray-600">
          {t('createQuickTransaction', { ns: 'transactions' })}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type & Status */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getTypeIcon(transactionType)}
              {t('transactionType', { ns: 'transactions' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('type', { ns: 'transactions' })}
                </Label>
                <Select 
                  onValueChange={(value: "income" | "expense") => {
                    setValue("transaction_type", value)
                  }}
                  defaultValue="income"
                >
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder={t('common.selectOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {t('income', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {t('expense', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.transaction_type && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.transaction_type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  {t('status', { ns: 'transactions' })}
                </Label>
                <Select
                  onValueChange={(value: "pending" | "completed" | "failed") => {
                    setValue("status", value)
                  }}
                  defaultValue="completed"
                >
                  <SelectTrigger className="bg-white border-2 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder={t('common.selectOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        {t('pending', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {t('completed', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        {t('failed', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.status.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount & Date */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              {t('amountAndDate', { ns: 'transactions' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('amount', { ns: 'transactions' })}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("amount", { valueAsNumber: true })} 
                    className="bg-white border-2 hover:border-blue-300 focus:border-blue-500 transition-colors pl-8"
                    placeholder={t('amountPlaceholder')}
                  />
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.amount && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('date', { ns: 'transactions' })}
                </Label>
                <Input
                  type="date"
                  {...register("date")} 
                  placeholder="jj/mm/aaaa"
                  className="bg-white border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
                {errors.date && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.date.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <Button 
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('createTransaction', { ns: 'transactions' })}
            </div>
          </Button>
        </div>
      </form>
    </div>
  )
}
