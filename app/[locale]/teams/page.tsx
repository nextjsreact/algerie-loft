import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { TeamsWrapper } from "@/components/teams/teams-wrapper"

export default async function TeamsPage() {
  const session = await requireRole(["admin", "manager"])
  const supabase = await createClient()

  const { data: teams, error } = await supabase
    .from("teams")
    .select(
      `
      *,
      profiles (full_name),
      team_members (user_id),
      tasks (status)
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const teamsWithStats = teams.map((team: any) => {
    const created_by_name = team.profiles?.full_name || "N/A"
    const member_count = team.team_members.length
    const active_tasks = (team.tasks as { status: string }[]).filter(
      (task) => task.status === "todo" || task.status === "in_progress"
    ).length

    return {
      ...team,
      created_by_name,
      member_count: String(member_count),
      active_tasks: String(active_tasks),
    }
  })

  return (
    <TeamsWrapper 
      teams={teamsWithStats} 
      userRole={session.user.role}
    />
  )
}
