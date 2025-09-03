"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'

export function CreateForm({
  onSubmit,
  categories,
  lofts,
  currencies,
  paymentMethods
}: {
  onSubmit: (data: any) => Promise<void>,
  categories: any[],
  lofts: any[],
  currencies: any[],
  paymentMethods: any[]
}) {
  const t = useTranslations('transactions')
  const [formData, setFormData] = useState({
    amount: '',
    type: 'income',
    status: 'completed',
    description: '',
    categoryId: '',
    loftId: '',
    currencyId: '',
    paymentMethodId: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSelect = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      // Valeurs par défaut pour les champs cachés
      amount: parseFloat(formData.amount) || 0,
      date: formData.date || new Date().toISOString().split('T')[0],
      description: formData.description || 'Transaction automatique'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm text-muted-foreground">{t('totalIncome', { ns: 'transactions' })}</p>
          <p className="text-2xl font-bold">0.00 DA</p>
        </div>
        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm text-muted-foreground">{t('totalExpenses', { ns: 'transactions' })}</p>
          <p className="text-2xl font-bold">0.00 DA</p>
        </div>
        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm text-muted-foreground">{t('netIncome', { ns: 'transactions' })}</p>
          <p className="text-2xl font-bold">0.00 DA</p>
        </div>
      </div>
      
      {/* Champs cachés - les données sont toujours envoyées mais pas visibles à l'utilisateur */}
      <input type="hidden" name="date" value={formData.date} />
      <input type="hidden" name="amount" value={formData.amount} />
      <input type="hidden" name="description" value={formData.description} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Select name="type" onValueChange={(value) => handleSelect('type', value)}>
          <SelectTrigger><SelectValue placeholder={t('type', { ns: 'transactions' })} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">{t('income', { ns: 'transactions' })}</SelectItem>
            <SelectItem value="expense">{t('expense', { ns: 'transactions' })}</SelectItem>
          </SelectContent>
        </Select>
        <Select name="categoryId" onValueChange={(value) => handleSelect('categoryId', value)}>
          <SelectTrigger><SelectValue placeholder={t('category', { ns: 'transactions' })} /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select name="loftId" onValueChange={(value) => handleSelect('loftId', value)}>
          <SelectTrigger><SelectValue placeholder={t('loft', { ns: 'transactions' })} /></SelectTrigger>
          <SelectContent>
            {lofts.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select name="currencyId" onValueChange={(value) => handleSelect('currencyId', value)}>
          <SelectTrigger><SelectValue placeholder={t('currency', { ns: 'transactions' })} /></SelectTrigger>
          <SelectContent>
            {currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.symbol})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select name="paymentMethodId" onValueChange={(value) => handleSelect('paymentMethodId', value)}>
          <SelectTrigger><SelectValue placeholder={t('paymentMethod', { ns: 'transactions' })} /></SelectTrigger>
          <SelectContent>
            {paymentMethods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">{t('createTransaction', { ns: 'transactions' })}</Button>
    </form>
  )
}
