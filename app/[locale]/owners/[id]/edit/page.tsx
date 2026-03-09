import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { OwnerForm } from "@/components/forms/owner-form"
import { updateOwner } from "@/app/actions/owners"
import { getTranslations } from "next-intl/server"
import { notFound } from 'next/navigation'

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
      .from("owners")
      .select("*")
      .eq("id", id)
      .single()

    if (!ownerData || error) {
      notFound()
    }

    // Adapter les champs au format attendu par OwnerForm
    const owner = {
      id: ownerData.id,
      name: ownerData.name || ownerData.business_name || '',
      ownership_type: (ownerData.ownership_type || (ownerData.business_type === 'company' ? 'company' : 'third_party')) as 'company' | 'third_party',
      email: ownerData.email || undefined,
      phone: ownerData.phone || undefined,
      address: ownerData.address || undefined,
    }

    console.log('Owner data loaded for edit:', { 
      id: owner.id, 
      name: owner.name, 
      email: owner.email,
      hasEmail: !!ownerData.email 
    })

    return (
      <OwnerForm 
        owner={owner}
        action={updateOwner.bind(null, id)}
      />
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
