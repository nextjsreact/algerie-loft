"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper"
import { toast } from "@/components/ui/use-toast"
import { useTranslations, useLocale } from "next-intl"
import { loftOwnerSchema, type LoftOwnerFormData } from "@/lib/validations"
import type { LoftOwner } from "@/lib/types"

interface OwnerFormProps {
  owner?: LoftOwner
  action: (formData: FormData) => Promise<{ error?: string }>
}

export function OwnerForm({ owner, action }: OwnerFormProps) {
  const t = useTranslations('owners')
  const tPlaceholders = useTranslations('owners.placeholders')
  const locale = useLocale()
  
  // Fallback placeholders if translations fail
  const getPlaceholder = (key: string) => {
    try {
      return tPlaceholders(key)
    } catch {
      const placeholders = {
        fr: {
          name: "Ex: Jean Dupont",
          email: "Ex: jean.dupont@email.com", 
          phone: "Ex: +213 555 123 456",
          address: "Ex: 123 Rue de la Paix, Alger"
        },
        en: {
          name: "Ex: John Smith",
          email: "Ex: john.smith@email.com",
          phone: "Ex: +213 555 123 456", 
          address: "Ex: 123 Peace Street, Algiers"
        },
        ar: {
          name: "مثال: أحمد محمد",
          email: "مثال: ahmed.mohamed@email.com",
          phone: "مثال: +213 555 123 456",
          address: "مثال: 123 شارع السلام، الجزائر"
        }
      }
      return placeholders[locale as keyof typeof placeholders]?.[key as keyof typeof placeholders.fr] || ""
    }
  }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoftOwnerFormData>({
    resolver: zodResolver(loftOwnerSchema),
    defaultValues: owner
      ? {
          name: owner.name,
          email: owner.email || undefined,
          phone: owner.phone || undefined,
          address: owner.address || undefined,
          ownership_type: owner.ownership_type,
        }
      : {
          name: undefined,
          email: undefined,
          phone: undefined,
          address: undefined,
          ownership_type: "third_party",
        },
  })

  const handleFormSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await action(formData)
      if (result?.error) {
        setError(result.error)
        toast({
          title: "❌ Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      } else {
        const ownerName = formData.get("name") as string
        toast({
          title: "✅ Success",
          description: `Owner "${ownerName}" ${owner ? 'updated' : 'created'} successfully`,
          duration: 3000,
        })
        setTimeout(() => {
          router.push("/owners")
        }, 1000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormWrapper 
      maxWidth="2xl"
      title={owner ? t('editOwner') : t('addOwner')}
      description={owner ? t('updateOwnerInfo') : t('createNewOwner')}
      icon="👤"
    >
      <FormSection 
        title={t('ownerDetails')}
        description={t('enterOwnerInfo')}
        icon="🏠"
        colorScheme="default"
      >
        <form action={handleFormSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input 
                id="name" 
                {...register("name")} 
                className="bg-white placeholder:text-gray-400" 
                placeholder={getPlaceholder('name')}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_type">{t('ownershipType')} *</Label>
              <Select
                onValueChange={(value) => setValue("ownership_type", value as any)}
                defaultValue={owner?.ownership_type || "third_party"}
                {...register("ownership_type")}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{t('companyOwned')}</SelectItem>
                  <SelectItem value="third_party">{t('thirdParty')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.ownership_type && <p className="text-sm text-red-500">{errors.ownership_type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                className="bg-white placeholder:text-gray-400" 
                placeholder={getPlaceholder('email')}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input 
                id="phone" 
                {...register("phone")} 
                className="bg-white placeholder:text-gray-400" 
                placeholder={getPlaceholder('phone')}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('address')}</Label>
            <Textarea 
              id="address" 
              {...register("address")} 
              className="bg-white placeholder:text-gray-400" 
              placeholder={getPlaceholder('address')}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('saving') : owner ? t('updateOwner') : t('createOwner')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </FormSection>
    </FormWrapper>
  )
}
