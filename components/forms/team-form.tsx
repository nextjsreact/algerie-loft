"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper"
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import type { Team } from "@/lib/types"

interface TeamFormProps {
  team?: Team
  action: (formData: FormData) => Promise<{ error?: string; team?: Team }>
}

function SubmitButton({ team }: { team?: Team }) {
  const t = useTranslations('teams');
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? t('saving') : team ? t('updateTeam') : t('createTeam')}
    </Button>
  )
}

export function TeamForm({ team, action }: TeamFormProps) {
  const t = useTranslations('teams');
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
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
      } else if (result?.team) {
        toast({
          title: "✅ Success",
          description: `Team "${result.team.name}" ${team ? 'updated' : 'created'} successfully`,
          duration: 3000,
        })
        setTimeout(() => {
          if (team) {
            // Si c'est une modification, revenir à la page précédente
            router.back()
          } else {
            // Si c'est une création, aller vers la liste des équipes
            router.push("/teams")
          }
        }, 1000)
      } else {
        const teamName = formData.get("name") as string
        toast({
          title: "✅ Success",
          description: `Team "${teamName}" ${team ? 'updated' : 'created'} successfully`,
          duration: 3000,
        })
        setTimeout(() => {
          if (team) {
            // Si c'est une modification, revenir à la page précédente
            router.back()
          } else {
            // Si c'est une création, aller vers la liste des équipes
            router.push("/teams")
          }
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
    }
  }

  return (
    <FormWrapper 
      maxWidth="2xl"
      title={team ? t('editTeam') : t('createTeam')}
      description={team ? t('updateTeamInfo') : t('addNewTeam')}
      icon="👥"
    >
      <FormSection 
        title={t('teamDetails')}
        description={t('enterTeamInfo')}
        icon="🏢"
        colorScheme="blue"
      >
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('teamName')} *</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={team?.name || ""}
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea 
                id="description" 
                name="description"
                defaultValue={team?.description || ""}
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <SubmitButton team={team} />
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </FormSection>
    </FormWrapper>
  )
}
