"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamForm } from "@/components/forms/team-form"
import { createTeam } from "@/app/actions/teams"
import { useTranslations } from "next-intl"

export default function NewTeamPage() {
  const t = useTranslations("teams")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('createNewTeam')}</h1>
        <p className="text-muted-foreground">{t('addNewTeamDescription')}</p>
      </div>

      <TeamForm action={createTeam} />
    </div>
  )
}
