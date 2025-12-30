"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamForm } from "@/components/forms/team-form"
import { getTeam, updateTeam } from "@/app/actions/teams"
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react"
import type { Team } from "@/lib/types"

export default function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const loadTeam = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      const teamData = await getTeam(resolvedParams.id);
      setTeam(teamData);
      setLoading(false);
    };
    loadTeam();
  }, [params]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('loading')}</h1>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('teamNotFound')}</h1>
          <p className="text-muted-foreground">{t('teamNotFoundDescription', { id })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('editTeam')}</h1>
        <p className="text-muted-foreground">{t('updateTeamInfo')}</p>
      </div>

      <TeamForm team={team} action={updateTeam.bind(null, id)} />
    </div>
  )
}
