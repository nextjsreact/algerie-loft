'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Settings, Edit, Plus, AlertTriangle, TrendingUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface BudgetCategory {
  id: string
  category_name: string
  reference_amount: number
  tolerance_warning_percent: number
  tolerance_critical_percent: number
  currency: string
  is_active: boolean
  created_at: string
}

export function BudgetCategoriesManager() {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const t = useTranslations('admin')
  const [formData, setFormData] = useState({
    category_name: '',
    reference_amount: '',
    tolerance_warning_percent: '20',
    tolerance_critical_percent: '50'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('task_categories_budget')
        .select('*')
        .order('category_name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erreur lors du chargement des catégories')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const data = {
        category_name: formData.category_name,
        reference_amount: parseFloat(formData.reference_amount),
        tolerance_warning_percent: parseInt(formData.tolerance_warning_percent),
        tolerance_critical_percent: parseInt(formData.tolerance_critical_percent)
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('task_categories_budget')
          .update(data)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Catégorie mise à jour avec succès')
      } else {
        const { error } = await supabase
          .from('task_categories_budget')
          .insert(data)

        if (error) throw error
        toast.success('Catégorie créée avec succès')
      }

      setIsDialogOpen(false)
      setEditingCategory(null)
      setFormData({
        category_name: '',
        reference_amount: '',
        tolerance_warning_percent: '20',
        tolerance_critical_percent: '50'
      })
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (category: BudgetCategory) => {
    setEditingCategory(category)
    setFormData({
      category_name: category.category_name,
      reference_amount: category.reference_amount.toString(),
      tolerance_warning_percent: category.tolerance_warning_percent.toString(),
      tolerance_critical_percent: category.tolerance_critical_percent.toString()
    })
    setIsDialogOpen(true)
  }

  const toggleActive = async (category: BudgetCategory) => {
    try {
      const { error } = await supabase
        .from('task_categories_budget')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error
      toast.success(`Catégorie ${!category.is_active ? 'activée' : 'désactivée'}`)
      fetchCategories()
    } catch (error) {
      console.error('Error toggling category:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestion des Budgets de Référence
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gestion des Budgets de Référence
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCategory(null)
              setFormData({
                category_name: '',
                reference_amount: '',
                tolerance_warning_percent: '20',
                tolerance_critical_percent: '50'
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('editCategory') : t('newCategory')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category_name">{t('categoryName')}</Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                  placeholder="Ex: Plomberie, Électricité..."
                />
              </div>
              <div>
                <Label htmlFor="reference_amount">Montant de Référence (DZD)</Label>
                <Input
                  id="reference_amount"
                  type="number"
                  step="0.01"
                  value={formData.reference_amount}
                  onChange={(e) => setFormData({...formData, reference_amount: e.target.value})}
                  placeholder="15000.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warning_percent">Seuil d'Alerte (%)</Label>
                  <Input
                    id="warning_percent"
                    type="number"
                    value={formData.tolerance_warning_percent}
                    onChange={(e) => setFormData({...formData, tolerance_warning_percent: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="critical_percent">Seuil Critique (%)</Label>
                  <Input
                    id="critical_percent"
                    type="number"
                    value={formData.tolerance_critical_percent}
                    onChange={(e) => setFormData({...formData, tolerance_critical_percent: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave}>
                  {editingCategory ? t('update') : t('create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead>Montant de Référence</TableHead>
              <TableHead>Seuils d'Alerte</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {category.category_name}
                </TableCell>
                <TableCell>
                  {formatAmount(category.reference_amount)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      +{category.tolerance_warning_percent}%
                    </Badge>
                    <Badge variant="destructive">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{category.tolerance_critical_percent}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={category.is_active ? "default" : "secondary"}
                    className={category.is_active ? "bg-green-100 text-green-800" : ""}
                  >
                    {category.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={category.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleActive(category)}
                    >
                      {category.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}