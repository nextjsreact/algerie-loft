import { getTeam } from "@/app/actions/teams"
import { TeamDetailView } from "@/components/teams/team-detail-view"

export default async function TeamViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeam(id)

  return <TeamDetailView team={team} teamId={id} />
}
