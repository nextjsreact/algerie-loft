import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CategoryEditForm } from '@/components/settings/category-edit-form'

interface CategoryEditPageProps {
  params: {
    locale: string
    id: string
  }
}

// Mock function to get category data
async function getCategory(id: string) {
  // In a real app, this would fetch from database
  // For now, return mock data
  return {
    id,
    name: 'Catégorie Exemple',
    description: 'Description de la catégorie',
    color: '#3B82F6',
    icon: 'folder',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export default async function CategoryEditPage({ params }: CategoryEditPageProps) {
  const t = await getTranslations('settings.categories')
  
  try {
    const category = await getCategory(params.id)
    
    if (!category) {
      notFound()
    }

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('edit.title')}</h1>
          <p className="text-muted-foreground">{t('edit.description')}</p>
        </div>
        
        <CategoryEditForm category={category} />
      </div>
    )
  } catch (error) {
    console.error('Error loading category:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: CategoryEditPageProps) {
  const t = await getTranslations('settings.categories')
  
  return {
    title: t('edit.title'),
    description: t('edit.description')
  }
}