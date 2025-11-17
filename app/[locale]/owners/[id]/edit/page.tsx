import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { OwnerForm } from "@/components/forms/owner-form"
import { updateOwner } from "@/app/actions/owners"
import { getTranslations } from "next-intl/server"

export default async function EditOwnerPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  try {
    const { id, locale } = await params
    await requireRole(["admin"])
    const supabase = await createClient()
    
    // Add error handling for translations
    let t;
    try {
      t = await getTranslations('owners')
    } catch (error) {
      console.error('Translation loading error:', error)
      // Fallback translations
      t = (key: string) => {
        const fallbacks: Record<string, string> = {
          'ownerNotFound': 'Owner Not Found',
          'couldNotFindOwner': 'Could not find owner with ID',
          'editOwner': 'Edit Owner',
          'updateOwnerInfo': 'Update owner information'
        }
        return fallbacks[key] || key
      }
    }

    const { data: ownerData, error } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Error</h1>
            <p className="text-muted-foreground">Error loading owner: {error.message}</p>
          </div>
        </div>
      )
    }

    if (!ownerData) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('ownerNotFound')}</h1>
            <p className="text-muted-foreground">{t('couldNotFindOwner')} {id}</p>
          </div>
        </div>
      )
    }

    // Adapter les champs de partner_profiles au format attendu par OwnerForm
    const owner = {
      id: ownerData.id,
      name: ownerData.business_name || '',
      ownership_type: ownerData.business_type === 'company' ? 'company' : 'third_party',
      email: '', // Pas d'email dans partner_profiles
      phone: ownerData.phone || '',
      address: ownerData.address || '',
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('editOwner')}</h1>
          <p className="text-muted-foreground">{t('updateOwnerInfo')}</p>
        </div>

        <OwnerForm 
          owner={owner}
          action={updateOwner.bind(null, id)}
        />
      </div>
    )
  } catch (error) {
    console.error('Page error:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          <p className="text-muted-foreground">An error occurred while loading this page.</p>
        </div>
      </div>
    )
  }
}
