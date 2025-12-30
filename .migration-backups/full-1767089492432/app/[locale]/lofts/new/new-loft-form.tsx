"use client"

import { LoftForm } from "@/components/forms/loft-form"
import { createLoft } from "@/app/actions/lofts"
import type { LoftOwner, InternetConnectionType } from "@/lib/types"
import type { ZoneArea } from "@/app/actions/zone-areas"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface NewLoftFormWrapperProps {
  owners: LoftOwner[];
  zoneAreas: ZoneArea[];
  internetConnectionTypes: InternetConnectionType[];
  translations: {
    loftCreatedSuccess: string;
    loftCreatedSuccessDescription: string;
    errorCreatingLoft: string;
    errorCreatingLoftDescription: string;
    systemError: string;
    systemErrorDescription: string;
  }
}

export function NewLoftFormWrapper({ owners, zoneAreas, internetConnectionTypes, translations: t }: NewLoftFormWrapperProps) {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    try {
      const result = await createLoft(data)
      if (result?.success) {
        toast.success(t.loftCreatedSuccess.replace('{name}', data.name), {
          description: t.loftCreatedSuccessDescription,
          duration: 4000,
        })
        setTimeout(() => {
          router.push("/lofts")
        }, 1500)
      } else {
        toast.error(t.errorCreatingLoft, {
          description: t.errorCreatingLoftDescription,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error creating loft:', error)
      toast.error(t.systemError, {
        description: t.systemErrorDescription,
        duration: 6000,
      })
    }
  }

  return <LoftForm owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
