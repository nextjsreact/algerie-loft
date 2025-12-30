import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    // Get current user info
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 })
    }

    // Get user's teams
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        team:teams (
          id,
          name
        )
      `)
      .eq('user_id', userId)

    // Get all users the current user can message
    const allowedUserIds: string[] = []

    // Get all admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'admin')

    if (admins) {
      allowedUserIds.push(...admins.map(a => a.id))
    }

    // If current user is admin, they can message everyone
    if (currentUser.role === 'admin') {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', userId)

      if (allUsers) {
        allowedUserIds.push(...allUsers.map(u => u.id))
      }
    } else {
      // Get team members from user's teams
      const teamIds = userTeams?.map(ut => ut.team_id) || []
      
      if (teamIds.length > 0) {
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', teamIds)

        if (teamMembers) {
          allowedUserIds.push(...teamMembers.map(tm => tm.user_id))
        }
      }
    }

    // Remove duplicates and current user
    const uniqueAllowedIds = Array.from(new Set(allowedUserIds)).filter(id => id !== userId)

    // Get details of allowed users
    const { data: allowedUsers } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', uniqueAllowedIds)

    const result = {
      currentUser: {
        id: currentUser.id,
        name: currentUser.full_name,
        email: currentUser.email,
        role: currentUser.role
      },
      teams: userTeams?.map((ut: any) => ({
        id: ut.team_id,
        name: ut.team?.name || 'Unknown Team'
      })) || [],
      canMessage: allowedUsers?.map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role
      })) || [],
      totalUsersCanMessage: uniqueAllowedIds.length,
      isAdmin: currentUser.role === 'admin'
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error testing permissions:', error)
    return NextResponse.json(
      { error: 'Failed to test permissions' }, 
      { status: 500 }
    )
  }
}