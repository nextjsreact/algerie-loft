'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
// import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CategoryEditFormProps {
  category: Category
}

export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const t = useTranslations('settings.categories')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: category.name || '',
    description: category.description || '',
    color: category.color || '#3B82F6',
    icon: category.icon || '',
    isActive: category.isActive
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Mock API call - in real app, this would update the category
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // toast.success(t('edit.success'))
      router.push('/settings/categories')
    } catch (error) {
      // toast.error(t('edit.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('edit.confirmDelete'))) return
    
    setIsLoading(true)
    try {
      // Mock API call - in real app, this would delete the category
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // toast.success(t('edit.deleteSuccess'))
      router.push('/settings/categories')
    } catch (error) {
      // toast.error(t('edit.deleteError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('edit.back')}
        </Button>
        
        <Badge variant={category.isActive ? 'default' : 'secondary'}>
          {category.isActive ? t('status.active') : t('status.inactive')}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('edit.basicInfo')}</CardTitle>
            <CardDescription>{t('edit.basicInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('form.namePlaceholder')}
                key={`name-${t('form.namePlaceholder')}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('form.descriptionPlaceholder')}
                key={`description-${t('form.descriptionPlaceholder')}`}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t('form.color')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder={t('form.colorPlaceholder')}
                    key={`color-${t('form.colorPlaceholder')}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">{t('form.icon')}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder={t('form.iconPlaceholder')}
                  key={`icon-${t('form.iconPlaceholder')}`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">{t('form.isActive')}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('edit.metadata')}</CardTitle>
            <CardDescription>{t('edit.metadataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <strong>{t('edit.id')}:</strong> {category.id}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>{t('edit.createdAt')}:</strong> {new Date(category.createdAt).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>{t('edit.updatedAt')}:</strong> {new Date(category.updatedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('edit.delete')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              {t('edit.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? t('edit.saving') : t('edit.save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}