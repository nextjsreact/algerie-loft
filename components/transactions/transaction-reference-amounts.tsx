'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, DollarSign, Edit, Plus, Save, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface TransactionReference {
  category: string
  transaction_type: 'income' | 'expense'
  reference_amount: number
  currency: string
  description: string
}

export function TransactionReferenceAmounts() {
  const t = useTranslations('transactions')
  const [references, setReferences] = useState<TransactionReference[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{ open: boolean; reference: TransactionReference | null }>({ open: false, reference: null })
  const [newReference, setNewReference] = useState({ category: '', type: 'expense', amount: '', description: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchReferences()
  }, [])

  const fetchReferences = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_transaction_category_references')
      
      if (error) {
        throw error
      }
      
      setReferences(data || [])
    } catch (error) {
      console.error('Error fetching transaction references:', error)
      toast.error(t('loadingError'))
    } finally {
      setLoading(false)
    }
  }

  const updateReference = async (category: string, type: string, amount: number, description?: string) => {
    try {
      const { data, error } = await supabase.rpc('update_transaction_reference_amount', {
        category_name: category,
        trans_type: type,
        new_amount: amount,
        new_description: description
      })
      
      if (error) {
        throw error
      }
      
      toast.success(t('updateSuccess'))
      fetchReferences()
      setEditDialog({ open: false, reference: null })
    } catch (error) {
      console.error('Error updating reference:', error)
      toast.error(t('updateError'))
    }
  }

  const addNewReference = async () => {
    if (!newReference.category || !newReference.amount || !newReference.type) {
      toast.error(t('fillAllFields'))
      return
    }

    try {
      await updateReference(
        newReference.category.toLowerCase(),
        newReference.type,
        parseFloat(newReference.amount),
        newReference.description
      )
      
      setNewReference({ category: '', type: 'expense', amount: '', description: '' })
    } catch (error) {
      console.error('Error adding reference:', error)
      toast.error(t('addError'))
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      // Expense categories
      maintenance: '🔧',
      cleaning: '🧹',
      repair: '🛠️',
      plumbing: '🚰',
      electrical: '⚡',
      painting: '🎨',
      security: '🔒',
      inspection: '🔍',
      utilities: '💡',
      insurance: '🛡️',
      taxes: '📋',
      supplies: '📦',
      // Income categories
      rent: '🏠',
      deposit: '💰',
      late_fees: '⏰',
      parking: '🚗',
      services: '🔧',
      other: '📋'
    }
    return icons[category] || '📋'
  }

  const getCategoryLabel = (category: string) => {
    return t(`categories.${category}`) || category
  }

  const expenseReferences = references.filter(ref => ref.transaction_type === 'expense')
  const incomeReferences = references.filter(ref => ref.transaction_type === 'income')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('referenceAmountsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div />
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('referenceAmountsTitle')}
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addNewCategory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-category">{t('categoryLabel')}</Label>
                  <Input
                    id="new-category"
                    placeholder={t('categoryPlaceholder')}
                    value={newReference.category}
                    onChange={(e) => setNewReference({...newReference, category: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="new-type">{t('transactionType')}</Label>
                  <Select onValueChange={(value) => setNewReference({...newReference, type: value})} value={newReference.type}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">{t('expense')}</SelectItem>
                      <SelectItem value="income">{t('income')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-amount">{t('referenceAmountDZD')}</Label>
                  <Input
                    id="new-amount"
                    type="number"
                    step="0.01"
                    placeholder={t('amountPlaceholder')}
                    value={newReference.amount}
                    onChange={(e) => setNewReference({...newReference, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="new-description">{t('description')}</Label>
                  <Textarea
                    id="new-description"
                    placeholder={t('description')}
                    value={newReference.description}
                    onChange={(e) => setNewReference({...newReference, description: e.target.value})}
                  />
                </div>
                <Button onClick={addNewReference} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {t('addCategory')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {t('expenses')} ({expenseReferences.length})
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('income')} ({incomeReferences.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses" className="space-y-3 mt-4">
              {expenseReferences.map((ref) => (
                <ReferenceCard key={`${ref.category}-${ref.transaction_type}`} reference={ref} onUpdate={updateReference} />
              ))}
            </TabsContent>
            
            <TabsContent value="income" className="space-y-3 mt-4">
              {incomeReferences.map((ref) => (
                <ReferenceCard key={`${ref.category}-${ref.transaction_type}`} reference={ref} onUpdate={updateReference} />
              ))}
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">{t('howItWorks')}</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>{t('howItWorksSteps.step1')}</li>
                  <li>{t('howItWorksSteps.step2')}</li>
                  <li>{t('howItWorksSteps.step3')}</li>
                  <li>{t('howItWorksSteps.step4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ReferenceCardProps {
  reference: TransactionReference
  onUpdate: (category: string, type: string, amount: number, description: string) => void
}

function ReferenceCard({ reference, onUpdate }: ReferenceCardProps) {
  const t = useTranslations('transactions')
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      maintenance: '🔧', cleaning: '🧹', repair: '🛠️', plumbing: '🚰',
      electrical: '⚡', painting: '🎨', security: '🔒', inspection: '🔍',
      utilities: '💡', insurance: '🛡️', taxes: '📋', supplies: '📦',
      rent: '🏠', deposit: '💰', late_fees: '⏰', parking: '🚗',
      services: '🔧', other: '📋'
    }
    return icons[reference.category] || '📋'
  }

  const getCategoryLabel = (category: string) => {
    return t(`categories.${category}`) || category
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getCategoryIcon(reference.category)}</span>
        <div>
          <div className="font-medium">{getCategoryLabel(reference.category)}</div>
          <div className="text-sm text-gray-600">{reference.description}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-lg font-semibold">
          {reference.reference_amount.toLocaleString()} {reference.currency}
        </Badge>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('edit')} {getCategoryLabel(reference.category)}</DialogTitle>
            </DialogHeader>
            <EditReferenceForm 
              reference={reference} 
              onSave={(amount, description) => onUpdate(reference.category, reference.transaction_type, amount, description)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

interface EditReferenceFormProps {
  reference: TransactionReference
  onSave: (amount: number, description: string) => void
}

function EditReferenceForm({ reference, onSave }: EditReferenceFormProps) {
  const t = useTranslations('transactions')
  const [amount, setAmount] = useState(reference.reference_amount.toString())
  const [description, setDescription] = useState(reference.description)

  const handleSave = () => {
    if (!amount) {
      toast.error(t('enterAmount'))
      return
    }
    
    onSave(parseFloat(amount), description)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-amount">{t('referenceAmountDZD')}</Label>
        <Input
          id="edit-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="edit-description">{t('description')}</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {t('save')}
      </Button>
    </div>
  )
}